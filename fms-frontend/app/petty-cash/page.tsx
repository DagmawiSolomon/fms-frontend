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
  TriangleAlertIcon,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useRole } from "@/components/role-provider"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// --- Mock Petty Cash Data ---
const initialTransactions = [
  { id: "PC-101", description: "Office snacks", category: "Meals", amount: 45.00, date: "2026-05-01", recordedBy: "Finance Team", status: "verified" },
  { id: "PC-102", description: "Taxi for staff (local)", category: "Travel", amount: 12.50, date: "2026-05-03", recordedBy: "Alex Torres", status: "verified" },
  { id: "PC-103", description: "Printer ink", category: "Office Supplies", amount: 85.00, date: "2026-05-04", recordedBy: "Finance Team", status: "pending" },
  { id: "PC-104", description: "Cleaning supplies", category: "Maintenance", amount: 30.00, date: "2026-05-05", recordedBy: "Finance Team", status: "verified" },
  { id: "PC-105", description: "Coffee beans replenishment", category: "Meals", amount: 25.00, date: "2026-05-06", recordedBy: "Sarah Jenkins", status: "pending" },
]

const pettyCashSchema = z.object({
  description: z.string().min(3, "Description is required"),
  category: z.string().min(2, "Category is required"),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  date: z.string().min(8, "Date is required"),
})

type PettyCashFormValues = z.infer<typeof pettyCashSchema>

export default function PettyCashPage() {
  const { role, hasPermission } = useRole()
  
  const canRecord = hasPermission("petty_cash.record_transaction")
  const canVerify = hasPermission("petty_cash.verify")

  const [transactions, setTransactions] = React.useState(initialTransactions)
  const [weeklyLimit] = React.useState(250)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [hideThresholdAlert, setHideThresholdAlert] = React.useState(false)

  const totalSpent = transactions.reduce((acc, t) => acc + t.amount, 0)
  const remainingBalance = Math.max(weeklyLimit - totalSpent, 0)
  const usagePercent = (totalSpent / weeklyLimit) * 100
  const isThresholdReached = usagePercent >= 80

  const filteredTransactions = transactions.filter(t => 
    t.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreate = (values: PettyCashFormValues) => {
    const newTransaction = {
      id: `PC-${Math.floor(Math.random() * 1000)}`,
      description: values.description,
      category: values.category,
      amount: values.amount,
      date: values.date,
      recordedBy: "Current User",
      status: "pending" as const,
    }
    setTransactions([newTransaction, ...transactions])
    toast.success("Transaction recorded successfully")
    setDialogOpen(false)
  }

  const handleVerify = (id: string) => {
    setTransactions(transactions.map(t => t.id === id ? { ...t, status: "verified" as const } : t))
    toast.success("Transaction verified")
  }

  return (
    <DashboardShell
      title="Petty Cash"
      description="Track weekly petty cash expenditures and maintain financial governance."
      actions={
        canRecord ? (
          <Button onClick={() => setDialogOpen(true)}>
            <PlusIcon className="mr-2 size-4" />
            Record transaction
          </Button>
        ) : null
      }
    >
      <div className="flex flex-col gap-0">
        {isThresholdReached && !hideThresholdAlert && (
          <div className="mb-6">
            <Alert className="bg-black text-rose-500 border-rose-500/30 flex items-center justify-between pr-2 [&>svg+div]:translate-y-0 rounded-[4px]">
              <div className="flex items-start gap-3">
                <TriangleAlertIcon className="mt-0.5 size-4" />
                <div className="flex-col justify-center">
                  <AlertTitle>Threshold Alert (80%)</AlertTitle>
                  <AlertDescription>
                    Weekly petty cash usage has reached {usagePercent.toFixed(1)}%. Monitor expenditures closely.
                  </AlertDescription>
                </div>
              </div>
              <Button
                className="pl-0! text-rose-500 hover:bg-rose-500/10 hover:text-rose-400"
                onClick={() => setHideThresholdAlert(true)}
                size="icon"
                variant="ghost"
              >
                <XIcon className="h-5 w-5" />
              </Button>
            </Alert>
          </div>
        )}

        <div className="grid gap-0 md:grid-cols-3 border border-b-0 rounded-none overflow-hidden">
          <SummaryCard
            label="Weekly limit"
            value={weeklyLimit}
            description="Maximum allowed spending for the current week"
            isFirst
            trend={{ value: "Stable", isUp: true }}
            trendLabel="fixed limit"
          />
          <SummaryCard
            label="Total spent"
            value={totalSpent}
            description="Accumulated spending this week"
            trend={{ value: `${usagePercent.toFixed(1)}%`, isUp: isThresholdReached }}
            trendLabel="of limit used"
          />
          <SummaryCard
            label="Remaining balance"
            value={remainingBalance}
            description="Available funds before limit is reached"
            trend={{ value: formatMoney(remainingBalance), isUp: !isThresholdReached }}
            trendLabel="available now"
          />
        </div>

        <Card className="rounded-b-[4px] overflow-hidden border shadow-none">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-2.5 top-1.5 size-4 text-muted-foreground" />
                <Input 
                  placeholder="Search transactions..." 
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
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
                    <TableHead className="text-xs text-muted-foreground/50">Recorded By</TableHead>
                    {canVerify && <TableHead className="text-right text-xs text-muted-foreground/50">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length ? (
                    filteredTransactions.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>
                          <div className="text-sm font-normal text-foreground">{t.description}</div>
                          <div className="text-xs text-muted-foreground">{t.id}</div>
                        </TableCell>
                        <TableCell>{t.category}</TableCell>
                        <TableCell className="text-xs">{t.date}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatMoney(t.amount)}</TableCell>
                        <TableCell>
                          <StatusBadge status={t.status as any} />
                        </TableCell>
                        <TableCell>{t.recordedBy}</TableCell>
                        {canVerify && (
                          <TableCell className="text-right">
                            {t.status === "pending" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleVerify(t.id)}
                              >
                                <CheckIcon className="mr-2 size-4" />
                                Verify
                              </Button>
                            ) : (
                              <div className="flex justify-end pr-4">
                                <CheckIcon className="size-4 text-emerald-500" />
                              </div>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={canVerify ? 7 : 6} className="h-24 text-center">
                        No transactions found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <TransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreate}
      />
    </DashboardShell>
  )
}

function TransactionDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: PettyCashFormValues) => void
}) {
  const form = useForm<PettyCashFormValues>({
    resolver: zodResolver(pettyCashSchema) as Resolver<PettyCashFormValues>,
    defaultValues: {
      description: "",
      category: "",
      amount: 0,
      date: new Date().toISOString().split("T")[0],
    },
  })

  React.useEffect(() => {
    if (!open) form.reset()
  }, [form, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record petty cash</DialogTitle>
          <DialogDescription>
            Enter the details of the petty cash expenditure
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-4"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <Field
            label="Description"
            error={form.formState.errors.description?.message}
            control={<Input placeholder="Office snacks" {...form.register("description")} />}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Amount"
              error={form.formState.errors.amount?.message}
              control={
                <Input
                  type="number"
                  step="0.01"
                  {...form.register("amount", { valueAsNumber: true })}
                />
              }
            />
            <Field
              label="Category"
              error={form.formState.errors.category?.message}
              control={<Input placeholder="Meals" {...form.register("category")} />}
            />
          </div>
          <Field
            label="Date"
            error={form.formState.errors.date?.message}
            control={<Input type="date" {...form.register("date")} />}
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
              Record transaction
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
        <CardTitle className="text-3xl tabular-nums tracking-tight text-foreground">
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

function StatusBadge({ status }: { status: "pending" | "verified" }) {
  const tone =
    status === "verified"
      ? "border-emerald-500/20 text-emerald-500"
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
  }).format(value)
}
