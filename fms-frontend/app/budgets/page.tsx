"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import type { Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"
import {
  CheckIcon,
  PlusIcon,
  RotateCcwIcon,
  XIcon,
} from "lucide-react"

import { DashboardShell } from "@/components/dashboard-shell"
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
import { useSession } from "@/hooks/use-session"
import {
  fmsApi,
  normalizeBudgets,
  type FmsBudget,
  type FmsBudgetStatus,
} from "@/lib/fms"
import { normalizeRole } from "@/lib/auth"
import { toast } from "sonner"

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
  const session = useSession()
  const role = normalizeRole(session.data?.role ?? null)
  const canManageBudgets = role !== "user"
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingBudget, setEditingBudget] = React.useState<FmsBudget | null>(
    null
  )

  const budgetsQuery = useQuery({
    queryKey: ["budgets"],
    queryFn: async () => normalizeBudgets(await fmsApi.getBudgets()),
  })

  const createMutation = useMutation({
    mutationFn: (values: BudgetFormValues) =>
      fmsApi.createBudget({
        ...values,
        notes: values.notes || undefined,
      }),
    onSuccess: async () => {
      toast.success("Budget created")
      await queryClient.invalidateQueries({ queryKey: ["budgets"] })
      setDialogOpen(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: FmsBudget["id"]
      values: Partial<BudgetFormValues>
    }) => fmsApi.updateBudget(id, values),
    onSuccess: async () => {
      toast.success("Budget updated")
      await queryClient.invalidateQueries({ queryKey: ["budgets"] })
      setDialogOpen(false)
      setEditingBudget(null)
    },
  })

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: FmsBudget["id"]
      status: FmsBudgetStatus
    }) => fmsApi.setBudgetStatus(id, status),
    onSuccess: async (_, variables) => {
      toast.success(`Budget ${variables.status}`)
      await queryClient.invalidateQueries({ queryKey: ["budgets"] })
    },
  })

  const budgets = budgetsQuery.data ?? []
  const totals = budgets.reduce(
    (acc, budget) => {
      acc.amount += budget.amount
      acc.spent += budget.spent
      acc.remaining += Math.max(budget.amount - budget.spent, 0)
      return acc
    },
    { amount: 0, spent: 0, remaining: 0 }
  )

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
      description="Create, review, approve, and track budget lines"
      actions={
        canManageBudgets ? (
          <Button onClick={openCreateDialog}>
            <PlusIcon />
            New budget
          </Button>
        ) : null
      }
    >
      <div className="grid gap-4 px-4 md:grid-cols-3">
        <SummaryCard label="Budget total" value={totals.amount} />
        <SummaryCard label="Spent total" value={totals.spent} />
        <SummaryCard label="Remaining total" value={totals.remaining} />
      </div>

      <Card className="mx-4">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Budget ledger</CardTitle>
            <CardDescription>
              Status changes are reflected in the ledger immediately
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => budgetsQuery.refetch()}
          >
            <RotateCcwIcon />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border">
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
                {budgetsQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      Loading budgets...
                    </TableCell>
                  </TableRow>
                ) : budgets.length ? (
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
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!canManageBudgets}
                            onClick={() => openEditDialog(budget)}
                          >
                            Update
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={
                              !canManageBudgets || budget.status === "approved"
                            }
                            onClick={() =>
                              statusMutation.mutate({
                                id: budget.id,
                                status: "approved",
                              })
                            }
                          >
                            <CheckIcon />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={
                              !canManageBudgets || budget.status === "rejected"
                            }
                            onClick={() =>
                              statusMutation.mutate({
                                id: budget.id,
                                status: "rejected",
                              })
                            }
                          >
                            <XIcon />
                            Reject
                          </Button>
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
            updateMutation.mutate({ id: editingBudget.id, values })
          } else {
            createMutation.mutate(values)
          }
        }}
        isSaving={createMutation.isPending || updateMutation.isPending}
      />
    </DashboardShell>
  )
}

function BudgetDialog({
  open,
  budget,
  onOpenChange,
  onSubmit,
  isSaving,
}: {
  open: boolean
  budget: FmsBudget | null
  onOpenChange: (open: boolean) => void
  onSubmit: (values: BudgetFormValues) => void
  isSaving: boolean
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
            Keep budget details organized and easy to review.
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
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : budget ? "Update budget" : "Create budget"}
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

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {formatMoney(value)}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Updated from the latest budget records
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
