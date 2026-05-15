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
  ArrowUpRightIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
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
import { fmsApi, normalizeBudgets, filterByDepartment, filterByOwnership } from "@/lib/fms"
import type { FmsBudget, FmsBudgetStatus, FmsSessionUser } from "@/lib/fms"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { isFinanceLeadershipEmail } from "@/lib/auth"
import { getUserFromCache } from "@/lib/user-cache"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"


const budgetSchema = z.object({
  name: z.string().min(2, "Budget name is required"),
  department: z.string().min(2, "Department is required"),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  spent: z.coerce.number().min(0, "Spent value cannot be negative"),
  period: z.string().min(2, "Period is required"),
  year: z.coerce.number().int().min(2020, "Invalid year"),
  status: z.enum(["draft", "pending", "approved", "rejected"]),
  notes: z.string().optional(),
})

type BudgetFormValues = z.infer<typeof budgetSchema>

import { useRouter } from "next/navigation"

export default function BudgetsPage() {
  const { user, role, config, hasPermission } = useRole()
  const router = useRouter()

  React.useEffect(() => {
    if (!config.navigation.includes("Budgets")) {
      router.push("/dashboard")
    }
  }, [config, router])

  const isLeadership = isFinanceLeadershipEmail(user?.email)
  const canCreateBudgets = hasPermission("budgets.create")
  const canEditBudgets = hasPermission("budgets.update")
  const canApproveBudgets = role === "finance" || isLeadership
  const canRejectBudgets = canApproveBudgets

  const [budgets, setBudgets] = React.useState<FmsBudget[]>([])
  const [loading, setLoading] = React.useState(true)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = React.useState(false)
  const [pendingRejectBudgetId, setPendingRejectBudgetId] = React.useState<string | number | null>(null)
  const [rejectReason, setRejectReason] = React.useState("")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [deptFilter, setDeptFilter] = React.useState("all")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [selectedUserProfile, setSelectedUserProfile] = React.useState<any | null>(null)

  const fetchBudgets = React.useCallback(async () => {
    try {
      setLoading(true)
      const budgetsData = await fmsApi.getBudgets()
      const normalizedBudgets = normalizeBudgets(budgetsData)
      
      // Enforce department isolation
      let visibleBudgets = filterByDepartment(normalizedBudgets, user, role)
      
      // Managers should only see budgets they created themselves
      if (role === "manager" || role === "employee") {
        visibleBudgets = filterByOwnership(visibleBudgets, user)
      }
      
      setBudgets(visibleBudgets)
    } catch (error) {
      console.error("Failed to fetch budgets:", error)
    } finally {
      setLoading(false)
    }
  }, [user, role])

  React.useEffect(() => {
    fetchBudgets()
  }, [fetchBudgets])

  const filteredBudgets = budgets.filter(budget => {
    const matchesSearch = (budget.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      String(budget.id).toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDept = deptFilter === "all" || budget.department === deptFilter
    const matchesStatus = statusFilter === "all" || budget.status === statusFilter
    return matchesSearch && matchesDept && matchesStatus
  })

  const getBudgetSubmitter = React.useCallback((budget: FmsBudget) => {
    const submitterId = budget.owner ?? null
    if (!submitterId) return null

    const cachedUser = getUserFromCache(submitterId)
    return cachedUser ?? { id: submitterId, name: `${submitterId}`, email: "", role: "employee" }
  }, [])

  const totals = budgets.reduce(
    (acc, budget) => {
      if (budget.status === "approved") acc.amount += budget.amount
      acc.spent += budget.spent
      acc.remaining += Math.max(budget.amount - budget.spent, 0)
      if (budget.status === "pending" || budget.status === "draft") acc.pending += budget.amount
      return acc
    },
    { amount: 0, spent: 0, remaining: 0, pending: 0 }
  )

  const handleCreate = async (values: BudgetFormValues) => {
    try {
      const generatedName = `${values.department} ${values.period} Budget`
      await fmsApi.createBudget({
        ...values,
        name: generatedName,
        status: values.status as FmsBudgetStatus,
        userId: user?.id as string | undefined
      })
      toast.success("Budget created successfully")
      setDialogOpen(false)
      fetchBudgets()
    } catch (error) {
      toast.error("Failed to create budget. Please check your inputs.")
    }
  }

  const handleStatusChange = async (id: string | number, status: FmsBudgetStatus, reason?: string) => {
    try {
      await fmsApi.setBudgetStatus(id, status, reason)
      toast.success(`Budget marked as ${status}`)
      fetchBudgets()
    } catch (error) {
      toast.error("Failed to update budget status.")
    }
  }

  const openRejectDialog = (id: string | number) => {
    setPendingRejectBudgetId(id)
    setRejectReason("")
    setRejectDialogOpen(true)
  }

  const confirmReject = async () => {
    if (!pendingRejectBudgetId || !rejectReason.trim()) {
      toast.error("Please provide a rejection reason.")
      return
    }

    await handleStatusChange(pendingRejectBudgetId, "rejected", rejectReason.trim())
    setRejectDialogOpen(false)
    setPendingRejectBudgetId(null)
    setRejectReason("")
  }

  const openCreateDialog = () => {
    setDialogOpen(true)
  }

  const showActions = canEditBudgets || canApproveBudgets || canRejectBudgets
  const showSubmitterColumn = role !== "manager" && role !== "employee"

  return (
    <DashboardShell
      title="Budgets"
      description="Submit department budget proposals and track approvals or rejections."
      actions={
        canCreateBudgets ? (
          <Button onClick={openCreateDialog}>
            <PlusIcon className="mr-2 size-4" />
            New budget
          </Button>
        ) : null
      }
    >
      <div className="grid gap-0 md:grid-cols-2 border border-b-0 rounded-none overflow-hidden">
        <SummaryCard
          label="Budget total"
          value={totals.amount}
          description="Total approved budget value across all departments"
          isFirst
          trend={{ value: `${filteredBudgets.length}`, isUp: true }}
          trendLabel="active budgets"
          loading={loading}
        />
        <SummaryCard
          label="Pending total"
          value={totals.pending}
          description="Budget value still awaiting approval"
          trend={{ 
            value: `${((totals.pending / (totals.amount || 1)) * 100).toFixed(1)}%`, 
            isUp: false 
          }}
          trendLabel="of total budget"
          loading={loading}
        />
      </div>

      <Card className="rounded-b-[4px] overflow-hidden border shadow-none">
        <CardContent className="pt-6">
            <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-2.5 top-1.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search budgets..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {(role === "admin" || role === "finance") && (
                <div className="flex gap-2">
                  <Select value={deptFilter} onValueChange={setDeptFilter}>
                    <SelectTrigger className="w-[180px]">
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
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

          <div className="overflow-hidden rounded-none">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs text-muted-foreground/50">Budget</TableHead>
                  <TableHead className="text-xs text-muted-foreground/50">Department</TableHead>
                  {showSubmitterColumn && <TableHead className="text-xs text-muted-foreground/50">Submitter</TableHead>}
                  <TableHead className="text-right text-xs text-muted-foreground/50">Amount</TableHead>
                  <TableHead className="text-right text-xs text-muted-foreground/50">Spent</TableHead>
                  <TableHead className="text-xs text-muted-foreground/50">Status</TableHead>
                  {showActions && <TableHead className="text-right text-xs text-muted-foreground/50">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-[180px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                      {showSubmitterColumn && <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>}
                      <TableCell className="text-right"><Skeleton className="h-4 w-[80px] ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-[80px] ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                      {showActions && <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>}
                    </TableRow>
                  ))
                ) : filteredBudgets.length ? (
                  filteredBudgets.map((budget) => (
                    <TableRow key={budget.id}>
                      <TableCell>
                        <div className="text-sm font-normal text-foreground">{budget.name}</div>
                      </TableCell>
                      <TableCell>{budget.department || "Unassigned"}</TableCell>
                      {showSubmitterColumn && (
                        <TableCell>
                          {(() => {
                            const submitter = getBudgetSubmitter(budget)
                            if (!submitter) return <span className="text-sm text-muted-foreground">{budget.owner || "N/A"}</span>
                            return (
                              <button
                                type="button"
                                onClick={() => setSelectedUserProfile(submitter)}
                                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
                              >
                                {submitter.name}
                                <ArrowUpRightIcon className="size-3" />
                              </button>
                            )
                          })()}
                        </TableCell>
                      )}
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(budget.amount)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(budget.spent)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={budget.status} />
                      </TableCell>
                      {showActions && (
                        <TableCell>
                          <div className="flex justify-end gap-2">

                            {canEditBudgets && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0 disabled:cursor-not-allowed"
                                disabled={budget.status !== "pending" && budget.status !== "draft"}
                                onClick={() => {}}
                              >
                                <PencilIcon className="size-3.5" />
                                <span className="sr-only">Edit</span>
                              </Button>
                            )}
                            {canApproveBudgets && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="disabled:cursor-not-allowed"
                                disabled={budget.status !== "pending"}
                                onClick={() => handleStatusChange(budget.id, "approved")}
                              >
                                <CheckIcon className="size-4" />
                                <span className="sr-only">Approve</span>
                              </Button>
                            )}
                            {canRejectBudgets && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="disabled:cursor-not-allowed"
                                disabled={budget.status !== "pending"}
                                onClick={() => openRejectDialog(budget.id)}
                              >
                                <XIcon className="size-4" />
                                <span className="sr-only">Reject</span>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={showActions ? (showSubmitterColumn ? 7 : 6) : (showSubmitterColumn ? 6 : 5)} className="h-24 text-center">
                      No budgets found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <BudgetDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
        }}
        onSubmit={(values) => {
          handleCreate(values)
        }}
        userDept={user?.department}
        isGlobalAdmin={role === "admin" || role === "finance"}
      />

      <Sheet open={!!selectedUserProfile} onOpenChange={(open) => !open && setSelectedUserProfile(null)}>
        <SheetContent className="flex flex-col gap-0 p-0">
          {selectedUserProfile && (
            <>
              <SheetHeader className="p-6 border-b border-border/50">
                <SheetTitle>Submitter Profile</SheetTitle>
                <SheetDescription>
                  Cached local user information for the budget proposal submitter.
                </SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto">
                <div className="grid gap-6 p-6">
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
                          <div
                            className={cn(
                              "size-1.5 rounded-full",
                              (selectedUserProfile.status || "active") === "active"
                                ? "bg-emerald-500"
                                : "bg-slate-500"
                            )}
                          />
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

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject budget proposal</DialogTitle>
            <DialogDescription>
              Add a reason so the submitter understands what needs to change.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <label className="text-xs text-muted-foreground/60" htmlFor="reject-reason">
              Rejection reason
            </label>
            <Input
              id="reject-reason"
              placeholder="Explain why this proposal was rejected"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false)
                setPendingRejectBudgetId(null)
                setRejectReason("")
              }}
            >
              Cancel
            </Button>
            <Button type="button" onClick={confirmReject}>
              Reject proposal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}

function BudgetDialog({
  open,
  onOpenChange,
  onSubmit,
  userDept,
  isGlobalAdmin,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: BudgetFormValues) => void
  userDept?: string | null
  isGlobalAdmin: boolean
}) {
  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema) as Resolver<BudgetFormValues>,
    defaultValues: {
      name: "",
      department: "",
      amount: 0,
      spent: 0,
      period: "",
      year: new Date().getFullYear(),
      status: "pending",
      notes: "",
    },
  })

  const [isEditingPeriod, setIsEditingPeriod] = React.useState(false)

  React.useEffect(() => {
    if (!open) {
      form.reset({
        name: "",
        department: isGlobalAdmin ? "" : (userDept || ""),
        amount: 0,
        spent: 0,
        period: "",
        year: new Date().getFullYear(),
        status: "pending",
        notes: "",
      })
      setIsEditingPeriod(false)
      return
    }

    if (!isGlobalAdmin && userDept && !form.getValues("department")) {
      form.setValue("department", userDept)
    }

    // Auto-calculate current quarter and year for new budget
    const now = new Date()
    const q = Math.floor(now.getMonth() / 3) + 1
    const y = now.getFullYear()
    const p = `Q${q}-${y}`
      form.setValue("period", p)
      form.setValue("year", y)
      if (!form.getValues("name")) {
        const dept = form.getValues("department") || userDept || "Department"
        form.setValue("name", `${dept} ${p} Budget`)
      }
  }, [form, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create budget proposal</DialogTitle>
          <DialogDescription>
            Enter the department request, then finance or leadership can approve or reject it.
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-4"
          onSubmit={form.handleSubmit((values) =>
            onSubmit(values as BudgetFormValues)
          )}
        >
          <Field
            label="Department"
            error={form.formState.errors.department?.message}
            control={
              <Select
                value={form.watch("department")}
                onValueChange={(value) =>
                  form.setValue("department", value, { shouldValidate: true })
                }
                disabled={!isGlobalAdmin}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {isGlobalAdmin ? (
                    <>
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="IT">IT</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="Operations">Operations</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="test_department">Test Department</SelectItem>
                    </>
                  ) : (
                    <SelectItem value={userDept || "General"}>{userDept || "General"}</SelectItem>
                  )}
                </SelectContent>
              </Select>
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
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Period (Quarter)"
              error={form.formState.errors.period?.message}
              control={
                <div className="flex gap-2">
                  <Select
                    value={form.watch("period")?.split("-")[0] || "Q1"}
                    onValueChange={(v) => {
                      const y = form.getValues("period")?.split("-")[1] || new Date().getFullYear()
                      form.setValue("period", `${v}-${y}`)
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Q1">Q1</SelectItem>
                      <SelectItem value="Q2">Q2</SelectItem>
                      <SelectItem value="Q3">Q3</SelectItem>
                      <SelectItem value="Q4">Q4</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    className="w-24"
                    value={form.watch("period")?.split("-")[1] || new Date().getFullYear()}
                    onChange={(e) => {
                      const y = e.target.value
                      const q = form.getValues("period")?.split("-")[0] || "Q1"
                      form.setValue("period", `${q}-${y}`)
                      form.setValue("year", parseInt(y))
                    }}
                  />
                </div>
              }
            />
          </div>

          <Field
            label="Notes"
            error={form.formState.errors.notes?.message}
            control={<Input placeholder="Optional notes" {...form.register("notes")} />}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Submit proposal
            </Button>
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

function StatusBadge({ status }: { status: FmsBudgetStatus }) {
  const tone =
    status === "approved"
      ? "border-emerald-500/20 text-emerald-500"
      : status === "rejected"
        ? "border-rose-500/20 text-rose-500"
        : status === "draft"
          ? "border-slate-500/20 text-slate-400"
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

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

function Info({ label, value, labelClassName }: { label: string; value: React.ReactNode; labelClassName?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className={cn("text-xs font-heading text-muted-foreground/50", labelClassName)}>{label}</div>
      <div className="text-sm text-foreground">{value}</div>
    </div>
  )
}
