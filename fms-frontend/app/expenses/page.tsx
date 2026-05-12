"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import type { Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  PlusIcon,
  SearchIcon,
  ShieldCheckIcon,
  XIcon,
} from "lucide-react"

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
import { fmsApi, normalizeExpenses, normalizeBudgets, filterByDepartment } from "@/lib/fms"
import type { FmsExpense, FmsBudget } from "@/lib/fms"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"


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
  const canVerifyExpense = hasPermission("expenses.verify")

  const [expenses, setExpenses] = React.useState<FmsExpense[]>([])
  const [budgets, setBudgets] = React.useState<FmsBudget[]>([])
  const [budgetsLoading, setBudgetsLoading] = React.useState(true)
  const [loading, setLoading] = React.useState(true)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [categoryFilter, setCategoryFilter] = React.useState("all")

  const canViewAll = hasPermission("expenses.view_all")

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
      
      // Enforce department isolation and ownership
      normalized = filterByDepartment(normalized, user, role)

      setExpenses(normalized)
    } catch (error) {
      console.error("Failed to fetch expenses:", error)
    } finally {
      setLoading(false)
    }
  }, [user, role])

  React.useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  const totals = expenses.reduce((acc, exp) => {
    acc.total += exp.amount
    if (exp.status === "pending") acc.pending += exp.amount
    if (exp.status === "approved" || exp.status === "verified") acc.approved += exp.amount
    return acc
  }, { total: 0, pending: 0, approved: 0 })

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = (expense.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      String(expense.id).toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "all" || expense.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const handleCreate = async (values: ExpenseFormValues) => {
    try {
      const response = await fmsApi.createExpense({
        description: values.description,
        amount: values.amount,
        category: values.category,
        budget_id: values.budget_id || null,
      })

      // Upload receipt if provided and we got an ID back
      const newExpense = response as any
      if (newExpense?.expense_id && values.receipt) {
        await fmsApi.uploadReceipt(newExpense.expense_id, values.receipt)
      } else if (newExpense?.id && values.receipt) {
        await fmsApi.uploadReceipt(newExpense.id, values.receipt)
      }

      toast.success("Expense submitted successfully")
      setDialogOpen(false)
      
      const newExpenses = normalizeExpenses([response])
      if (newExpenses.length > 0) {
        setExpenses((prev) => [newExpenses[0], ...prev])
      }
      
      // Also fetch in the background to ensure consistency
      fetchExpenses()
    } catch (error) {
      toast.error("Failed to submit expense. Please check your inputs and receipt.")
    }
  }

  const handleStatusChange = async (id: string | number, status: FmsExpense["status"]) => {
    try {
      if (status === "verified") {
        await fmsApi.verifyExpense(id)
      }
      toast.success(`Expense marked as ${status}`)
      fetchExpenses()
    } catch (error) {
      toast.error("Failed to update expense status.")
    }
  }

  const showActions = canApproveExpense || canVerifyExpense

  return (
    <DashboardShell
      title="Expenses"
      description="Review and verify itemized expenses submitted by staff."
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
          label="Pending review"
          value={totals.pending}
          description="Expenses currently awaiting financial audit"
          trend={{ value: `${filteredExpenses.filter(e => e.status === "pending").length}`, isUp: false }}
          trendLabel="items pending"
          loading={loading}
        />
        <SummaryCard
          label="Avg. expense"
          value={filteredExpenses.length > 0 ? totals.total / filteredExpenses.length : 0}
          description="Average value of submitted expenses"
          trend={{ value: "LIVE", isUp: true }}
          trendLabel="calculation"
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
                  <TableHead className="text-xs text-muted-foreground/50">Status</TableHead>
                  {showActions && <TableHead className="text-right text-xs text-muted-foreground/50">Actions</TableHead>}
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
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                      {showActions && <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>}
                    </TableRow>
                  ))
                ) : filteredExpenses.length ? (
                  filteredExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="">
                        {expense.description}
                        {expense.receiptUrl && (
                          <span className="ml-2 text-xs text-muted-foreground">(Receipt attached)</span>
                        )}
                      </TableCell>
                      <TableCell>{expense.category}</TableCell>
                      <TableCell>{expense.date}</TableCell>
                      <TableCell className="text-right">
                        {formatMoney(expense.amount)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={expense.status} />
                      </TableCell>
                      {showActions && (
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            {canApproveExpense && expense.status === "pending" && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleStatusChange(expense.id, "approved")}
                                >
                                  <CheckIcon className="size-4" />
                                  <span className="sr-only">Approve</span>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleStatusChange(expense.id, "rejected")}
                                >
                                  <XIcon className="size-4" />
                                  <span className="sr-only">Reject</span>
                                </Button>
                              </>
                            )}
                            {canVerifyExpense && expense.status === "approved" && (
                              <Button
                                variant="default"
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={() => handleStatusChange(expense.id, "verified")}
                              >
                                <ShieldCheckIcon className="mr-2 size-4" />
                                Verify
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={showActions ? 6 : 5} className="h-24 text-center">
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
    </DashboardShell>
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

  React.useEffect(() => {
    if (!open) {
      form.reset({
        description: "",
        category: "",
        amount: 0,
        budget_id: "",
      })
    }
  }, [form, open])


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit expense</DialogTitle>
          <DialogDescription>
            Record an out-of-pocket or corporate card expense
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-4"
          onSubmit={form.handleSubmit((values) =>
            onSubmit(values as ExpenseFormValues)
          )}
        >
          <Field
            label="Description"
            error={form.formState.errors.description?.message}
            control={
              <Input placeholder="Office supplies, Travel to NY..." {...form.register("description")} />
            }
          />
          <div className="grid gap-4 md:grid-cols-2">
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
              label="Receipt (Optional)"
              control={
                <Input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      form.setValue("receipt", file)
                      toast.success("Receipt attached")
                    }
                  }}
                />
              }
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
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
                    <SelectValue placeholder={budgetsLoading ? "Loading budgets…" : "Select a budget"} />
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
                    <SelectValue placeholder="Select a category" />
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


          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Submit expense</Button>
          </DialogFooter>
        </form>
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
  const tone =
    status === "verified"
      ? "border-blue-500/20 text-blue-400"
      : status === "approved"
        ? "border-emerald-500/20 text-emerald-500"
        : status === "rejected"
          ? "border-rose-500/20 text-rose-500"
          : "border-amber-500/20 text-amber-500"

  return (
    <Badge variant="outline" className={cn(tone, "rounded-[4px] bg-black capitalize font-medium")}>
      {status}
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
