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
import { fmsApi, normalizeBudgets } from "@/lib/fms"
import type { FmsBudget, FmsBudgetStatus, FmsSessionUser } from "@/lib/fms"


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

  const canCreateBudgets = hasPermission("budgets.create")
  const canApproveBudgets = hasPermission("budgets.approve")
  const canRejectBudgets = hasPermission("budgets.reject")

  const [budgets, setBudgets] = React.useState<FmsBudget[]>([])
  const [loading, setLoading] = React.useState(true)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [deptFilter, setDeptFilter] = React.useState("all")

  const fetchBudgets = React.useCallback(async () => {
    try {
      setLoading(true)
      const budgetsData = await fmsApi.getBudgets()
      const normalizedBudgets = normalizeBudgets(budgetsData)
      setBudgets(normalizedBudgets)
    } catch (error) {
      console.error("Failed to fetch budgets:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchBudgets()
  }, [fetchBudgets])

  const filteredBudgets = budgets.filter(budget => {
    const matchesSearch = (budget.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      String(budget.id).toLowerCase().includes(searchQuery.toLowerCase())
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

  const handleCreate = async (values: BudgetFormValues) => {
    try {
      await fmsApi.createBudget({
        ...values,
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

  const handleStatusChange = async (id: string | number, status: FmsBudgetStatus) => {
    try {
      await fmsApi.setBudgetStatus(id, status)
      toast.success(`Budget marked as ${status}`)
      fetchBudgets()
    } catch (error) {
      toast.error("Failed to update budget status.")
    }
  }

  const openCreateDialog = () => {
    setDialogOpen(true)
  }

  const showActions = true

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
                  <SelectItem value="Finance">Finance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-hidden rounded-none">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs text-muted-foreground/50">Budget</TableHead>
                  <TableHead className="text-xs text-muted-foreground/50">Department</TableHead>
                  <TableHead className="text-right text-xs text-muted-foreground/50">Amount</TableHead>
                  <TableHead className="text-right text-xs text-muted-foreground/50">Spent</TableHead>
                  <TableHead className="text-xs text-muted-foreground/50">Status</TableHead>
                  {showActions && <TableHead className="text-right text-xs text-muted-foreground/50">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBudgets.length ? (
                  filteredBudgets.map((budget) => (
                    <TableRow key={budget.id}>
                      <TableCell>
                        <div className="text-sm font-normal text-foreground">{budget.name}</div>
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
                      {showActions && (
                        <TableCell>
                          <div className="flex justify-end gap-2">

                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => {}}
                            >
                              <PencilIcon className="size-3.5" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-500/5 border-rose-500/20"
                              onClick={() => {}}
                            >
                              <TrashIcon className="size-3.5" />
                              <span className="sr-only">Delete</span>
                            </Button>
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
                    <TableCell colSpan={showActions ? 6 : 5} className="h-24 text-center">
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
      />
    </DashboardShell>
  )
}

function BudgetDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
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
        department: "",
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

    // Auto-calculate current quarter and year for new budget
    const now = new Date()
    const q = Math.floor(now.getMonth() / 3) + 1
    const y = now.getFullYear()
    const p = `Q${q}-${y}`
    form.setValue("period", p)
    form.setValue("year", y)
  }, [form, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create budget</DialogTitle>
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
              <Select
                value={form.watch("department")}
                onValueChange={(value) =>
                  form.setValue("department", value, { shouldValidate: true })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Engineering">Engineering</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="IT">IT</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                  <SelectItem value="Operations">Operations</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
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
              Create budget
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
