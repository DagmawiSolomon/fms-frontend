"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import type { Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  CheckIcon,
  PlusIcon,
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
  const { role } = useRole()
  
  const canCreateBudgets = role === "finance" || role === "admin"
  const canUpdateBudgets = role === "finance" || role === "admin" || role === "manager"
  const canApproveBudgets = role === "manager" || role === "admin"

  const [budgets, setBudgets] = React.useState<FmsBudget[]>(mockBudgetsData)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingBudget, setEditingBudget] = React.useState<FmsBudget | null>(null)

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
        />
        <SummaryCard
          label="Spent total"
          value={totals.spent}
          description="Total actual spending recorded to date"
        />
        <SummaryCard
          label="Remaining total"
          value={totals.remaining}
          description="Total unspent funds across all budget lines"
        />
      </div>

      <Card className="rounded-b-[4px] overflow-hidden border shadow-none">
        <CardContent className="pt-6">
          <div className="overflow-hidden rounded-none border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Budget</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Spent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budgets.length ? (
                  budgets.map((budget) => (
                    <TableRow key={budget.id}>
                      <TableCell>
                        <div className="font-medium">{budget.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {budget.period || "No period"}
                        </div>
                      </TableCell>
                      <TableCell>{budget.department || "Unassigned"}</TableCell>
                      <TableCell className="text-right">
                        {formatMoney(budget.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatMoney(budget.spent)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={budget.status} />
                      </TableCell>
                      <TableCell>{budget.owner || "System"}</TableCell>
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
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={budget.status === "approved"}
                                onClick={() => handleStatusChange(budget.id, "approved")}
                              >
                                <CheckIcon className="size-4" />
                                <span className="sr-only">Approve</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={budget.status === "rejected"}
                                onClick={() => handleStatusChange(budget.id, "rejected")}
                              >
                                <XIcon className="size-4" />
                                <span className="sr-only">Reject</span>
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
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
    <div className="grid gap-2">
      <div className="text-sm font-medium">{label}</div>
      {control}
      {error ? <div className="text-sm text-destructive">{error}</div> : null}
    </div>
  )
}

function SummaryCard({
  label,
  value,
  description,
  isFirst,
}: {
  label: string
  value: number
  description: string
  isFirst?: boolean
}) {
  return (
    <Card className={cn(
      "rounded-none border-b-0 border-r-0 border-t-0 shadow-none @container/card border-border/50",
      !isFirst && "border-l"
    )}>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl font-medium tabular-nums @[250px]/card:text-3xl">
          {formatMoney(value)}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
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
    <Badge variant="outline" className={tone}>
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
