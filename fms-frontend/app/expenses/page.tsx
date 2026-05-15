"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { useForm } from "react-hook-form"
import type { Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format, isValid, parseISO } from "date-fns"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  PlusIcon,
  SearchIcon,
  ArrowUpRight,
  ExternalLink,
  Receipt,
  FileSearch,
  Maximize2
} from "lucide-react"
import { Alert01Icon } from "@hugeicons/core-free-icons"

import { DashboardShell } from "@/components/dashboard-shell"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useRole } from "@/components/role-provider"
import { toast } from "sonner"
import { fmsApi, normalizeExpenses, normalizeBudgets, filterByDepartment, filterByOwnership, enrichExpensesWithBudgetDepartments } from "@/lib/fms"
import type { FmsExpense, FmsBudget } from "@/lib/fms"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Spinner } from "@/components/ui/spinner"
import { getUserFromCache } from "@/lib/user-cache"
import { isFinanceLeadershipEmail } from "@/lib/auth"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { CalendarIcon, UserIcon, BriefcaseIcon, DollarSignIcon, FileTextIcon, TagIcon } from "lucide-react"


const expenseSchema = z.object({
  description: z.string().min(2, "Description is required"),
  category: z.string().min(2, "Category is required"),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  budget_id: z.string().min(1, "Budget is required"),
  receipt: z.any().optional(),
})

type ExpenseFormValues = z.infer<typeof expenseSchema>

import { useRouter } from "next/navigation"

export default function ExpensesPage() {
  const { user, role, config, hasPermission } = useRole()
  const router = useRouter()

  React.useEffect(() => {
    if (!config.navigation.includes("Expenses")) {
      router.push("/dashboard")
    }
  }, [config, router])

  const canCreateExpense = hasPermission("expenses.create")
  const canApproveExpense = hasPermission("expenses.approve")

  const [expenses, setExpenses] = React.useState<FmsExpense[]>([])
  const [budgets, setBudgets] = React.useState<FmsBudget[]>([])
  const [budgetsLoading, setBudgetsLoading] = React.useState(true)
  const [loading, setLoading] = React.useState(true)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [categoryFilter, setCategoryFilter] = React.useState("all")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [departmentFilter, setDepartmentFilter] = React.useState("all")
  const [selectedUserProfile, setSelectedUserProfile] = React.useState<any | null>(null)
  const [verificationDialogOpen, setVerificationDialogOpen] = React.useState(false)
  const [selectedExpenseForVerification, setSelectedExpenseForVerification] = React.useState<FmsExpense | null>(null)

  // Preload budgets independently so they're ready before the dialog opens
  React.useEffect(() => {
    setBudgetsLoading(true)
    fmsApi.getBudgets()
      .then((data) => {
        let normalized = normalizeBudgets(data)
        // Only show budgets for the user's department (non-admins)
        normalized = filterByDepartment(normalized, user, role)
        setBudgets(normalized)
      })
      .catch((err) => console.error("Failed to fetch budgets:", err))
      .finally(() => setBudgetsLoading(false))
  }, [role, user])

  const fetchExpenses = React.useCallback(async () => {
    try {
      setLoading(true)
      const data = await fmsApi.getExpenses()
      let normalized = normalizeExpenses(data)
      normalized = enrichExpensesWithBudgetDepartments(normalized, budgets)

      // Enforce department isolation and ownership
      normalized = role === "employee"
        ? filterByOwnership(normalized, user)
        : filterByDepartment(normalized, user, role)

      setExpenses(normalized)
    } catch (error) {
      console.error("Failed to fetch expenses:", error)
    } finally {
      setLoading(false)
    }
  }, [budgets, user, role])

  React.useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  const totals = expenses.reduce((acc, exp) => {
    acc.total += exp.amount
    if (exp.status === "pending") acc.pending += exp.amount
    if (exp.status === "verified") acc.verified += exp.amount
    return acc
  }, { total: 0, pending: 0, verified: 0 })

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = (expense.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      String(expense.id).toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "all" || expense.category === categoryFilter
    const matchesStatus = statusFilter === "all" || expense.status === statusFilter
    const matchesDept = departmentFilter === "all" || expense.department === departmentFilter
    return matchesSearch && matchesCategory && matchesStatus && matchesDept
  })

  const handleCreate = async (values: ExpenseFormValues) => {
    try {
      const response = await fmsApi.createExpense({
        description: values.description,
        amount: values.amount,
        category: values.category,
        budget_id: values.budget_id || null,
      })

      toast.success("Expense submitted successfully")
      setDialogOpen(false)

      const newExpenses = normalizeExpenses([response])
      if (newExpenses.length > 0) {
        const budgetDepartment = budgets.find((budget) =>
          String(budget.id).toLowerCase().trim() === String(newExpenses[0].budgetId ?? "").toLowerCase().trim()
        )?.department ?? user?.department ?? null

        setExpenses((prev) => [
          {
            ...newExpenses[0],
            status: "pending",
            approved: null,
            verified: null,
            department: newExpenses[0].department ?? budgetDepartment,
            receiptUrl: values.receipt ? "local" : null,
          },
          ...prev,
        ])
      }

      fetchExpenses()
    } catch (error) {
      toast.error("Failed to submit expense. Please try again.")
    }
  }

  const handleOpenVerification = (expense: FmsExpense) => {
    setSelectedExpenseForVerification(expense)
    setVerificationDialogOpen(true)
  }

  const handleConfirmVerification = async () => {
    if (!selectedExpenseForVerification) return

    const id = selectedExpenseForVerification.id
    try {
      await fmsApi.verifyExpense(id, true)
      setExpenses((prev) =>
        prev.map((expense) =>
          String(expense.id) === String(id)
            ? {
              ...expense,
              approved: true,
              verified: true,
              status: "verified",
            }
            : expense
        )
      )
      toast.success("Expense verified successfully")
      setVerificationDialogOpen(false)
      setSelectedExpenseForVerification(null)
    } catch (error) {
      toast.error("Failed to update expense status.")
    }
  }

  const isLeadership = isFinanceLeadershipEmail(user?.email)
  const canVerifyExpense = hasPermission("expenses.verify") && !isLeadership
  const showOwnershipColumns = role !== "employee"
  const showActionColumn = role === "finance" && !isLeadership

  return (
    <DashboardShell
      title="Expenses"
      description="Finance verifies itemized expenses submitted by staff."
      actions={
        canCreateExpense ? (
          <Button onClick={() => setDialogOpen(true)}>
            <PlusIcon className="mr-2 size-4" />
            Submit expense
          </Button>
        ) : null
      }
    >
      <div className="grid gap-0 md:grid-cols-3 border border-b-0 rounded-none overflow-hidden">
        <SummaryCard
          label="Total expenses"
          value={totals.total}
          description="Total actual spending in the current period"
          isFirst
          trend={{ value: `${filteredExpenses.length}`, isUp: true }}
          trendLabel="total items"
          loading={loading}
        />
        <SummaryCard
          label="Verified total"
          value={totals.verified}
          description="Expenses cleared by finance review"
          trend={{ value: `${filteredExpenses.filter(e => e.status === "verified").length}`, isUp: true }}
          trendLabel="verified items"
          loading={loading}
        />
        <SummaryCard
          label="Pending verification"
          value={totals.pending}
          description="Expenses still awaiting verification"
          trend={{ value: `${filteredExpenses.filter(e => e.status === "pending").length}`, isUp: false }}
          trendLabel="items pending"
          loading={loading}
        />
      </div>

      <Card className="rounded-b-[4px] overflow-hidden border shadow-none">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-2.5 top-1.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search description or ID..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {(role === "admin" || role === "finance" || isLeadership) && (
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="IT">IT</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="test_department">Test Department</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Travel">Travel</SelectItem>
                  <SelectItem value="Meals">Meals</SelectItem>
                  <SelectItem value="Software">Software</SelectItem>
                  <SelectItem value="Hardware">Hardware</SelectItem>
                  <SelectItem value="Stationery">Stationery</SelectItem>
                  <SelectItem value="Office">Office Supplies</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-hidden rounded-none">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs text-muted-foreground/50">Description</TableHead>
                  <TableHead className="text-xs text-muted-foreground/50">Category</TableHead>
                  <TableHead className="text-xs text-muted-foreground/50">Date</TableHead>
                  <TableHead className="text-right text-xs text-muted-foreground/50">Amount</TableHead>
                  {showOwnershipColumns && <TableHead className="text-xs text-muted-foreground/50">Submitter</TableHead>}
                  <TableHead className="text-xs text-muted-foreground/50">Status</TableHead>
                  {showActionColumn && <TableHead className="text-right text-xs text-muted-foreground/50">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-[80px] ml-auto" /></TableCell>
                      {showOwnershipColumns && <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>}
                      <TableCell><Skeleton className="h-4 w-[90px]" /></TableCell>
                      {showActionColumn && <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>}
                    </TableRow>
                  ))
                ) : filteredExpenses.length ? (
                  filteredExpenses.map((expense) => (
                    <TableRow
                      key={expense.id}
                    >
                      <TableCell className="">
                        {expense.description}
                        {expense.receiptUrl && (
                          <span className="ml-2 text-xs text-muted-foreground">(Receipt attached)</span>
                        )}
                      </TableCell>
                      <TableCell>{expense.category}</TableCell>
                      <TableCell className="text-muted-foreground/80">
                        {(() => {
                          const d = expense.date ? parseISO(expense.date) : null;
                          return d && isValid(d) ? format(d, "PPP") : "N/A";
                        })()}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatMoney(expense.amount)}
                      </TableCell>
                      {showOwnershipColumns && (
                        <TableCell>
                          <button
                            onClick={() => setSelectedUserProfile(getUserFromCache(expense.submitter))}
                            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
                          >
                            {getUserFromCache(expense.submitter)?.name || `${expense.submitter}`}
                            <ArrowUpRight className="size-3" />
                          </button>
                        </TableCell>
                      )}

                      <TableCell>
                        <StatusBadge status={expense.status} />
                      </TableCell>
                      {showActionColumn && (
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-2">
                            {canVerifyExpense && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="disabled:cursor-not-allowed"
                                disabled={expense.status !== "pending"}
                                onClick={() => handleOpenVerification(expense)}
                              >
                                <CheckIcon className="size-4" />
                                <span className="sr-only">Verify</span>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={showActionColumn ? (showOwnershipColumns ? 7 : 6) : (showOwnershipColumns ? 6 : 5)} className="h-24 text-center">
                      No expenses found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ExpenseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreate}
        budgets={budgets}
        budgetsLoading={budgetsLoading}
      />

      <VerificationDialog
        open={verificationDialogOpen}
        onOpenChange={setVerificationDialogOpen}
        onConfirm={handleConfirmVerification}
        expense={selectedExpenseForVerification}
      />

      <Sheet open={!!selectedUserProfile} onOpenChange={(open) => !open && setSelectedUserProfile(null)}>
        <SheetContent className="flex flex-col gap-0 p-0">
          {selectedUserProfile && (
            <>
              <SheetHeader className="p-6 border-b border-border/50">
                <SheetTitle>User Profile</SheetTitle>
                <SheetDescription>
                  Detailed information about the submitter and their organizational role.
                </SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto">
                <div className="grid gap-6 p-6">
                  {/* Cloned User Profile UI from users/page.tsx */}
                  <div className="flex items-center gap-4 py-2">
                    <Avatar className="h-12 w-12 rounded-full border border-border/50">
                      <AvatarFallback className="rounded-full" seed={selectedUserProfile.email} name={selectedUserProfile.name} />
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-base font-medium text-foreground">{selectedUserProfile.name}</span>
                      <span className="text-xs text-muted-foreground">{selectedUserProfile.email}</span>
                    </div>
                  </div>

                  <Separator className="bg-border/50" />

                  <div className="grid gap-6">
                    <Info label="System Role" value={<span className="capitalize">{selectedUserProfile.role}</span>} />

                    <Info label="Department" value={selectedUserProfile.department || "General"} />

                    <Info
                      label="Status"
                      value={
                        <div className="flex items-center gap-2">
                          <span className="capitalize">{selectedUserProfile.status || "active"}</span>
                          <div className={cn(
                            "size-1.5 rounded-full",
                            (selectedUserProfile.status || "active") === "active" ? "bg-emerald-500" : "bg-slate-500"
                          )} />
                        </div>
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-border/50 bg-white/[0.01]">
                <Button
                  variant="outline"
                  className="w-full rounded-[4px] h-10"
                  onClick={() => setSelectedUserProfile(null)}
                >
                  Close Profile
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </DashboardShell>
  )
}

function VerificationDialog({
  open,
  onOpenChange,
  onConfirm,
  expense,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  expense: FmsExpense | null
}) {
  if (!expense) return null

  const submitter = getUserFromCache(expense.submitter)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-1 px-6 pt-6">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl font-normal text-slate-50">
              Verify Expense Details
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground/60 font-normal">
              Review the submission details and attached receipt before confirming verification.
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
            <div className="flex flex-col md:flex-row gap-8 items-start px-6">
              {/* Left Column: Receipt Preview */}
              <div className="flex flex-col gap-3 w-48 shrink-0">
                {true ? (
                  <div className="relative group overflow-hidden rounded-[4px] border bg-muted/50 h-48 w-full flex items-center justify-center">
                    <img
                      src="/receipt.png"
                      alt="Receipt preview"
                      className="max-h-full max-w-full object-contain cursor-zoom-in"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://placehold.co/600x400/020617/cbd5e1?text=No+Image"
                      }}
                      onClick={() => window.open("/receipt.png", "_blank")}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button variant="secondary" size="sm" className="rounded-[4px] h-8 px-2 text-[10px]" onClick={() => window.open("/receipt.png", "_blank")}>
                        <Maximize2 className="mr-1.5 size-3" />
                        EXPAND
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="h-48 w-full border border-dashed rounded-[4px] flex flex-col items-center justify-center text-center gap-2 bg-muted/10">
                    <HugeiconsIcon icon={Alert01Icon} className="size-5 text-muted-foreground/20" />
                    <div className="text-[10px] text-muted-foreground/40 uppercase">Missing</div>
                  </div>
                )}
              </div>

              {/* Right Column: Core Info */}
              <div className="flex-1 space-y-6">
                <div className="space-y-4">
                  <Info label="Description" value={expense.description} valueClassName="text-lg" />
                  <div className="flex items-baseline gap-4">
                    <Info label="Amount" value={formatMoney(expense.amount)} valueClassName="text-3xl text-slate-50" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/40">
                  <Info label="Category" value={expense.category} />
                  <Info
                    label="Date"
                    value={(() => {
                      const d = expense.date ? parseISO(expense.date) : null;
                      return d && isValid(d) ? format(d, "PPP") : "N/A";
                    })()}
                  />
                  <Info label="Department" value={expense.department || "General"} />
                  <Info label="Submitted By" value={submitter?.name || `${expense.submitter}`} />
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-[4px]">
            Cancel
          </Button>
          <Button onClick={onConfirm} className="rounded-[4px]">
            Confirm Verification
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ExpenseDialog({
  open,
  onOpenChange,
  onSubmit,
  budgets,
  budgetsLoading,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: ExpenseFormValues) => void
  budgets: FmsBudget[]
  budgetsLoading: boolean
}) {
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema) as Resolver<ExpenseFormValues>,
    defaultValues: {
      description: "",
      category: "",
      amount: 0,
      budget_id: "",
    },
  })

  const [isFileLoading, setIsFileLoading] = React.useState(false)
  const [fileProgress, setFileProgress] = React.useState(0)
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) {
      form.reset({ description: "", category: "", amount: 0, budget_id: "" })
      setIsFileLoading(false)
      setFileProgress(0)
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
    }
  }, [form, open])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    form.setValue("receipt", file)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(file))

    // Animate progress bar to simulate "reading" the file
    setIsFileLoading(true)
    setFileProgress(0)
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 20) + 10
      if (progress >= 100) {
        progress = 100
        clearInterval(interval)
        setIsFileLoading(false)
        toast.success("Receipt ready")
      }
      setFileProgress(progress)
    }, 120)
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !isFileLoading && onOpenChange(val)}>
      <DialogContent className="max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-1 px-6 pt-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="font-heading text-xl font-normal text-slate-50">
              Submit Expense
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground/60 font-normal">
              Record an out-of-pocket or corporate card expense
            </DialogDescription>
          </DialogHeader>

          <form
            id="expense-form"
            className="grid gap-4"
            onSubmit={form.handleSubmit((values) => onSubmit(values as ExpenseFormValues))}
          >
            <div className="flex flex-col md:flex-row gap-6">
              {/* Receipt Preview on the left */}
              {(previewUrl || isFileLoading) && (
                <div className="w-48 shrink-0 flex flex-col gap-2 pt-6">
                  {previewUrl ? (
                    <div className="relative group overflow-hidden rounded-[4px] border bg-muted/30 h-48 w-full flex items-center justify-center">
                      <img
                        src={previewUrl}
                        alt="Receipt preview"
                        className="max-h-full max-w-full object-contain cursor-zoom-in"
                        onClick={() => window.open(previewUrl, "_blank")}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button variant="secondary" size="sm" className="rounded-[4px] h-8 px-2 text-[10px]" onClick={() => window.open(previewUrl, "_blank")}>
                          <Maximize2 className="mr-1.5 size-3" />
                          EXPAND
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-48 w-full border border-dashed rounded-[4px] flex flex-col items-center justify-center text-center gap-2 bg-muted/10 animate-pulse">
                      <Spinner className="size-4" />
                    </div>
                  )}

                  {isFileLoading && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-muted-foreground/60">Reading...</span>
                        <span>{fileProgress}%</span>
                      </div>
                      <Progress value={fileProgress} className="h-1" />
                    </div>
                  )}
                </div>
              )}

              <div className="flex-1 space-y-4">
                <Field
                  label="Description"
                  error={form.formState.errors.description?.message}
                  control={
                    <Input
                      placeholder="Office supplies, Travel to NY..."
                      {...form.register("description")}
                    />
                  }
                />
                <div className="grid gap-4 grid-cols-2">
                  <Field
                    label="Amount"
                    error={form.formState.errors.amount?.message}
                    control={
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        {...form.register("amount", { valueAsNumber: true })}
                      />
                    }
                  />
                  <Field
                    label="Category"
                    error={form.formState.errors.category?.message}
                    control={
                      <Select
                        value={form.watch("category")}
                        onValueChange={(value) =>
                          form.setValue("category", value, { shouldValidate: true })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Travel">Travel</SelectItem>
                          <SelectItem value="Meals">Meals</SelectItem>
                          <SelectItem value="Software">Software</SelectItem>
                          <SelectItem value="Hardware">Hardware</SelectItem>
                          <SelectItem value="Stationery">Stationery</SelectItem>
                          <SelectItem value="Office">Office Supplies</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    }
                  />
                </div>

                <Field
                  label="Linked Budget"
                  error={form.formState.errors.budget_id?.message}
                  control={
                    <Select
                      value={form.watch("budget_id")}
                      onValueChange={(value) =>
                        form.setValue("budget_id", value, { shouldValidate: true })
                      }
                      disabled={budgetsLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={budgetsLoading ? "Loading…" : "Select a budget"} />
                      </SelectTrigger>
                      <SelectContent>
                        {budgets.map((budget) => (
                          <SelectItem key={String(budget.id)} value={String(budget.id)}>
                            {budget.name || String(budget.id)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  }
                />

                <Field
                  label="Receipt (Optional)"
                  control={
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      disabled={isFileLoading}
                      onChange={handleFileChange}
                    />
                  }
                />
              </div>
            </div>
          </form>
        </ScrollArea>

        <DialogFooter className="p-6 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isFileLoading}
          >
            Cancel
          </Button>
          <Button form="expense-form" type="submit" disabled={isFileLoading}>
            {isFileLoading ? (
              <><Spinner className="mr-2 size-4" />Reading...</>
            ) : (
              "Submit expense"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  error,
  control,
}: {
  label: string
  error?: string
  control: React.ReactNode
}) {
  return (
    <div className="grid gap-1.5">
      <div className="text-xs text-muted-foreground/60">{label}</div>
      {control}
      {error ? <div className="text-xs text-destructive">{error}</div> : null}
    </div>
  )
}

function StatusBadge({ status }: { status: FmsExpense["status"] }) {
  const displayStatus = status === "approved" ? "verified" : status
  const tone =
    displayStatus === "verified"
      ? "border-emerald-500/20 text-emerald-500"
      : "border-amber-500/20 text-amber-500"

  return (
    <Badge variant="outline" className={cn(tone, "rounded-[4px] bg-black capitalize font-medium")}>
      {displayStatus}
    </Badge>
  )
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value)
}

function SummaryCard({
  label,
  value,
  description,
  isFirst,
  loading,
  trend,
  trendLabel,
}: {
  label: string
  value: number
  description: string
  isFirst?: boolean
  loading?: boolean
  trend?: {
    value: string
    isUp: boolean
  }
  trendLabel?: string
}) {
  if (loading) {
    return (
      <Card className={cn(
        "rounded-none border-b-0 border-r-0 border-t-0 shadow-none @container/card border-border/50",
        !isFirst && "border-l"
      )}>
        <CardHeader className="pb-2 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-3 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn(
      "rounded-none border-b-0 border-r-0 border-t-0 shadow-none @container/card border-border/50",
      !isFirst && "border-l"
    )}>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl font-heading tabular-nums text-slate-50">
          {formatMoney(value)}
        </CardTitle>
        {trend && (
          <div className="flex items-center gap-1 mt-1">
            <span className={cn(
              "text-[10px] flex items-center",
              trend.isUp ? "text-emerald-500" : "text-rose-500"
            )}>
              {trend.isUp ? <ArrowUpIcon className="size-3" /> : <ArrowDownIcon className="size-3" />}
              {trend.value}
            </span>
            {trendLabel && (
              <span className="text-[10px] text-muted-foreground">
                {trendLabel}
              </span>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">
        {description}
      </CardContent>
    </Card>
  )
}

function Info({ label, value, labelClassName, valueClassName }: { label: string; value: React.ReactNode; labelClassName?: string; valueClassName?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className={cn("text-[10px] uppercase tracking-wider font-heading text-muted-foreground/40 font-normal", labelClassName)}>{label}</div>
      <div className={cn("text-base text-slate-200 font-normal", valueClassName)}>{value}</div>
    </div>
  )
}
