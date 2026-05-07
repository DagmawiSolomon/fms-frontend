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
import type { FmsBudget, FmsBudgetStatus } from "@/lib/fms"

const mockBudgetsData: FmsBudget[] = [
  { id: "BUD-01", name: "Q1 Engineering Operations", department: "Engineering", amount: 150000, spent: 45000, status: "approved", owner: "Sarah Jenkins", period: "FY2026/Q1" },
  { id: "BUD-02", name: "Global Marketing Campaign", department: "Marketing", amount: 200000, spent: 85000, status: "approved", owner: "Marcus Webb", period: "FY2026/Q1" },
  { id: "BUD-03", name: "Office IT Expansion", department: "IT", amount: 75000, spent: 12000, status: "pending", owner: "Alex Torres", period: "FY2026/Q2" },
  { id: "BUD-04", name: "Executive Offsite", department: "HR", amount: 35000, spent: 35000, status: "approved", owner: "Diana Prince", period: "FY2026/Q1" },
  { id: "BUD-05", name: "Legacy System Decommission", department: "Engineering", amount: 50000, spent: 0, status: "rejected", owner: "Sarah Jenkins", period: "FY2026/Q2" },
]

const budgetSchema = z.object({
  name: z.string().min(2, "Budget name is required"),
  department: z.string().min(2, "Department is required"),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  spent: z.coerce.number().min(0, "Spent value cannot be negative"),
  period: z.string().min(2, "Period is required"),
  status: z.enum(["draft", "pending", "approved", "rejected"]),
  notes: z.string().optional(),
})

type BudgetFormValues = z.infer<typeof budgetSchema>

export default function BudgetsPage() {
  const { role, hasPermission } = useRole()
  
  const canCreateBudgets = hasPermission("budgets.create")
  const canUpdateBudgets = hasPermission("budgets.update")
  const canApproveBudgets = hasPermission("budgets.approve")
  const canRejectBudgets = hasPermission("budgets.reject")

  const [budgets, setBudgets] = React.useState<FmsBudget[]>(mockBudgetsData)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingBudget, setEditingBudget] = React.useState<FmsBudget | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [deptFilter, setDeptFilter] = React.useState("all")

  const filteredBudgets = budgets.filter(budget => {
    const matchesSearch = budget.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         budget.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDept = deptFilter === "all" || budget.department === deptFilter
    return matchesSearch && matchesDept
  })

  const totals = budgets.reduce(
    (acc, budget) => {
      acc.amount += budget.amount
      acc.spent += budget.spent
      acc.remaining += Math.max(budget.amount - budget.spent, 0)
      return acc
    },
    { amount: 0, spent: 0, remaining: 0 }
  )

  const handleCreate = (values: BudgetFormValues) => {
    const newBudget: FmsBudget = {
      id: `BUD-${Math.floor(Math.random() * 1000)}`,
      name: values.name,
      department: values.department,
      amount: values.amount,
      spent: values.spent,
      period: values.period,
      status: values.status as FmsBudgetStatus,
      owner: "Current User",
      notes: values.notes,
    }
    setBudgets([newBudget, ...budgets])
    toast.success("Budget created successfully")
    setDialogOpen(false)
  }

  const handleUpdate = (values: BudgetFormValues) => {
    if (!editingBudget) return
    setBudgets(budgets.map(b => b.id === editingBudget.id ? { ...b, ...values, status: values.status as FmsBudgetStatus } : b))
    toast.success("Budget updated successfully")
    setDialogOpen(false)
    setEditingBudget(null)
  }

  const handleStatusChange = (id: string | number, status: FmsBudgetStatus) => {
    setBudgets(budgets.map(b => b.id === id ? { ...b, status } : b))
    toast.success(`Budget marked as ${status}`)
  }

  const openCreateDialog = () => {
    setEditingBudget(null)
    setDialogOpen(true)
  }

  const openEditDialog = (budget: FmsBudget) => {
    setEditingBudget(budget)
    setDialogOpen(true)
  }

  const showActions = canUpdateBudgets || canApproveBudgets || canRejectBudgets

  return (
    <DashboardShell
      title="Budgets"
      description="Manage departmental funding and monitor expenditure."
      actions={
        canCreateBudgets ? (
          <Button onClick={openCreateDialog}>
            <PlusIcon className="mr-2 size-4" />
            New budget
          </Button>
        ) : null
      }
    >
      <div className="grid gap-0 md:grid-cols-3 border border-b-0 rounded-none overflow-hidden">
        <SummaryCard
          label="Budget total"
          value={totals.amount}
          description="Total funds allocated across all departments"
          isFirst
          trend={{ value: "+2.5%", isUp: true }}
          trendLabel="from last month"
        />
        <SummaryCard
          label="Spent total"
          value={totals.spent}
          description="Total actual spending recorded to date"
          trend={{ value: "+12.1%", isUp: true }}
          trendLabel="vs previous"
        />
        <SummaryCard
          label="Remaining total"
          value={totals.remaining}
          description="Total unspent funds across all budget lines"
          trend={{ value: "-4.3%", isUp: false }}
          trendLabel="from last month"
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
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-hidden rounded-none">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground/50">Budget</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground/50">Department</TableHead>
                  <TableHead className="text-right text-[10px] uppercase tracking-widest text-muted-foreground/50">Amount</TableHead>
                  <TableHead className="text-right text-[10px] uppercase tracking-widest text-muted-foreground/50">Spent</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground/50">Status</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground/50">Owner</TableHead>
                  {showActions && <TableHead className="text-right text-[10px] uppercase tracking-widest text-muted-foreground/50">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBudgets.length ? (
                  filteredBudgets.map((budget) => (
                    <TableRow key={budget.id}>
                      <TableCell>
                        <div className="text-sm font-normal text-foreground">{budget.name}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          {budget.period || "No period"}
                        </div>
                      </TableCell>
                      <TableCell>{budget.department || "Unassigned"}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(budget.amount)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(budget.spent)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={budget.status} />
                      </TableCell>
                      <TableCell>{budget.owner || "System"}</TableCell>
                      {showActions && (
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            {canUpdateBudgets && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(budget)}
                              >
                                Update
                              </Button>
                            )}
                            {canApproveBudgets && (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={budget.status === "approved"}
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
                                disabled={budget.status === "rejected"}
                                onClick={() => handleStatusChange(budget.id, "rejected")}
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
                    <TableCell colSpan={showActions ? 7 : 6} className="h-24 text-center">
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
        budget={editingBudget}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) {
            setEditingBudget(null)
          }
        }}
        onSubmit={(values) => {
          if (editingBudget) {
            handleUpdate(values)
          } else {
            handleCreate(values)
          }
        }}
      />
    </DashboardShell>
  )
}

function BudgetDialog({
  open,
  budget,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  budget: FmsBudget | null
  onOpenChange: (open: boolean) => void
  onSubmit: (values: BudgetFormValues) => void
}) {
  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema) as Resolver<BudgetFormValues>,
    defaultValues: {
      name: "",
      department: "",
      amount: 0,
      spent: 0,
      period: "",
      status: "pending",
      notes: "",
    },
  })

  React.useEffect(() => {
    if (!open) {
      form.reset({
        name: "",
        department: "",
        amount: 0,
        spent: 0,
        period: "",
        status: "pending",
        notes: "",
      })
      return
    }

    if (budget) {
      form.reset({
        name: budget.name,
        department: budget.department ?? "",
        amount: budget.amount,
        spent: budget.spent,
        period: budget.period ?? "",
        status: budget.status,
        notes: budget.notes ?? "",
      })
    }
  }, [budget, form, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{budget ? "Update budget" : "Create budget"}</DialogTitle>
          <DialogDescription>
            Enter funding details and department allocation
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-4"
          onSubmit={form.handleSubmit((values) =>
            onSubmit(values as BudgetFormValues)
          )}
        >
          <Field
            label="Budget name"
            error={form.formState.errors.name?.message}
            control={
              <Input placeholder="Operations Q3" {...form.register("name")} />
            }
          />
          <Field
            label="Department"
            error={form.formState.errors.department?.message}
            control={
              <Input placeholder="Finance" {...form.register("department")} />
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
              label="Spent"
              error={form.formState.errors.spent?.message}
              control={
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  {...form.register("spent", { valueAsNumber: true })}
                />
              }
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Period"
              error={form.formState.errors.period?.message}
              control={
                <Input placeholder="FY2026 / Q1" {...form.register("period")} />
              }
            />
            <Field
              label="Status"
              error={form.formState.errors.status?.message}
              control={
                <Select
                  value={form.watch("status")}
                  onValueChange={(value) =>
                    form.setValue(
                      "status",
                      value as BudgetFormValues["status"],
                      { shouldValidate: true }
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
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
              {budget ? "Update budget" : "Create budget"}
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
      <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60">{label}</div>
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
  trend,
  trendLabel,
}: {
  label: string
  value: number
  description: string
  isFirst?: boolean
  trend?: {
    value: string
    isUp: boolean
  }
  trendLabel?: string
}) {
  return (
    <Card className={cn(
      "rounded-none border-b-0 border-r-0 border-t-0 shadow-none @container/card border-border/50",
      !isFirst && "border-l"
    )}>
      <CardHeader className="pb-2">
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-1">{label}</div>
        <CardTitle className="text-2xl tabular-nums tracking-tight text-foreground @[250px]/card:text-3xl">
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
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
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
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
      : status === "rejected"
        ? "border-rose-500/30 bg-rose-500/10 text-rose-700"
        : status === "draft"
          ? "border-slate-500/30 bg-slate-500/10 text-slate-700"
          : "border-amber-500/30 bg-amber-500/10 text-amber-700"

  return (
    <Badge variant="outline" className={cn(tone, "rounded-[4px] capitalize")}>
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
