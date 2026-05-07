"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import type { Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  AlertTriangleIcon,
  CheckIcon,
  CoinsIcon,
  PlusIcon,
  SearchIcon,
  Settings2Icon,
  WalletIcon,
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
  const canSetLimit = hasPermission("petty_cash.set_limit")
  const canVerify = hasPermission("petty_cash.verify")

  const [transactions, setTransactions] = React.useState(initialTransactions)
  const [weeklyLimit, setWeeklyLimit] = React.useState(250)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  const totalSpent = transactions.reduce((acc, t) => acc + t.amount, 0)
  const remainingBalance = weeklyLimit - totalSpent
  const usagePercent = (totalSpent / weeklyLimit) * 100
  const isThresholdReached = usagePercent >= 80

  const filteredTransactions = transactions.filter(t => 
    t.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreate = (values: PettyCashFormValues) => {
    if (values.amount > remainingBalance) {
      toast.error("Transaction exceeds weekly limit!")
      return
    }

    const newTransaction = {
      id: `PC-${Math.floor(Math.random() * 1000)}`,
      description: values.description,
      category: values.category,
      amount: values.amount,
      date: values.date,
      recordedBy: "Current User",
      status: "pending",
    }
    setTransactions([newTransaction, ...transactions])
    toast.success("Transaction recorded")
    setDialogOpen(false)
  }

  const handleVerify = (id: string) => {
    setTransactions(transactions.map(t => t.id === id ? { ...t, status: "verified" } : t))
    toast.success("Transaction verified")
  }

  return (
    <DashboardShell
      title="Petty Cash Management"
      description="Track weekly petty cash expenditures and maintain financial governance."
      actions={
        canRecord ? (
          <Button onClick={() => setDialogOpen(true)} className="rounded-none">
            <PlusIcon className="mr-2 size-4" />
            Record Transaction
          </Button>
        ) : null
      }
    >
      <div className="flex flex-col gap-6">
        {isThresholdReached && (
          <Alert variant="destructive" className="rounded-none border-rose-500 bg-rose-500/10 text-rose-700 animate-pulse">
            <AlertTriangleIcon className="size-4" />
            <AlertTitle className="font-bold uppercase tracking-widest text-[10px]">Threshold Alert (80%)</AlertTitle>
            <AlertDescription className="text-xs">
              Weekly petty cash usage has reached {usagePercent.toFixed(1)}%. Please monitor expenditures closely.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-0 md:grid-cols-3 border border-b-0 rounded-none overflow-hidden">
          <SummaryCard
            label="Weekly Limit"
            value={weeklyLimit}
            description="Maximum allowed spending for the current week"
            isFirst
            icon={<Settings2Icon className="size-4 text-muted-foreground/50" />}
          />
          <SummaryCard
            label="Total Spent"
            value={totalSpent}
            description="Accumulated spending this week"
            icon={<WalletIcon className="size-4 text-muted-foreground/50" />}
          />
          <SummaryCard
            label="Remaining Balance"
            value={remainingBalance}
            description="Available funds before limit is reached"
            highlight={isThresholdReached ? "rose" : "emerald"}
            icon={<CoinsIcon className="size-4 text-muted-foreground/50" />}
          />
        </div>

        <Card className="rounded-b-[4px] overflow-hidden border shadow-none">
          <CardHeader className="border-b bg-muted/10">
            <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
              <div>
                <CardTitle className="text-sm uppercase tracking-widest font-bold">Recent Transactions</CardTitle>
                <CardDescription className="text-xs italic">Review and verify petty cash records</CardDescription>
              </div>
              <div className="relative w-full md:w-64">
                <SearchIcon className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
                <Input 
                  placeholder="Search description..." 
                  className="pl-9 h-9 rounded-none text-xs"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/5 hover:bg-muted/5">
                  <TableHead className="text-[10px] uppercase tracking-widest h-10">ID</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-widest h-10">Description</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-widest h-10">Category</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-widest h-10">Date</TableHead>
                  <TableHead className="text-right text-[10px] uppercase tracking-widest h-10">Amount</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-widest h-10 text-center">Status</TableHead>
                  {canVerify && <TableHead className="text-right text-[10px] uppercase tracking-widest h-10">Action</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length ? (
                  filteredTransactions.map((t) => (
                    <TableRow key={t.id} className="hover:bg-muted/5 group">
                      <TableCell className="font-mono text-[10px] text-muted-foreground">{t.id}</TableCell>
                      <TableCell className="text-sm font-medium">{t.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="rounded-none text-[10px] font-normal uppercase tracking-tighter py-0">
                          {t.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{t.date}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatMoney(t.amount)}</TableCell>
                      <TableCell className="text-center">
                        <StatusBadge status={t.status as any} />
                      </TableCell>
                      {canVerify && (
                        <TableCell className="text-right">
                          {t.status === "pending" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 rounded-none text-[10px] uppercase tracking-widest border-emerald-500/50 text-emerald-700 hover:bg-emerald-50"
                              onClick={() => handleVerify(t.id)}
                            >
                              <CheckIcon className="mr-1 size-3" />
                              Verify
                            </Button>
                          ) : (
                            <CheckIcon className="ml-auto size-4 text-emerald-500 opacity-50" />
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={canVerify ? 7 : 6} className="h-24 text-center text-muted-foreground text-sm italic">
                      No petty cash records found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
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

function SummaryCard({
  label,
  value,
  description,
  isFirst,
  highlight,
  icon
}: {
  label: string
  value: number
  description: string
  isFirst?: boolean
  highlight?: "rose" | "emerald"
  icon?: React.ReactNode
}) {
  return (
    <Card className={cn(
      "rounded-none border-b-0 border-r-0 border-t-0 shadow-none border-border/50 bg-card/30",
      !isFirst && "border-l"
    )}>
      <CardHeader className="pb-2 space-y-0">
        <div className="flex items-center justify-between">
          <CardDescription className="text-[10px] uppercase tracking-widest font-bold">{label}</CardDescription>
          {icon}
        </div>
        <CardTitle className={cn(
          "text-3xl tabular-nums tracking-tighter",
          highlight === "rose" ? "text-rose-600" : highlight === "emerald" ? "text-emerald-600" : "text-foreground"
        )}>
          {formatMoney(value)}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-[10px] text-muted-foreground leading-tight italic">
        {description}
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: "pending" | "verified" }) {
  const isVerified = status === "verified"
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "rounded-none capitalize text-[10px] font-bold tracking-widest",
        isVerified ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700" : "border-amber-500/30 bg-amber-500/10 text-amber-700"
      )}
    >
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
      <DialogContent className="rounded-none border-2 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="uppercase tracking-widest font-bold text-lg">Record Petty Cash</DialogTitle>
          <DialogDescription className="text-xs italic">
            Enter the details of the petty cash expenditure.
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-6 py-4"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div className="grid gap-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Description</label>
            <Input placeholder="e.g. Office snacks" className="rounded-none h-10" {...form.register("description")} />
            {form.formState.errors.description && <span className="text-xs text-rose-500">{form.formState.errors.description.message}</span>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Amount</label>
              <Input type="number" step="0.01" className="rounded-none h-10 font-mono" {...form.register("amount")} />
              {form.formState.errors.amount && <span className="text-xs text-rose-500">{form.formState.errors.amount.message}</span>}
            </div>
            <div className="grid gap-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Category</label>
              <Input placeholder="e.g. Meals" className="rounded-none h-10" {...form.register("category")} />
              {form.formState.errors.category && <span className="text-xs text-rose-500">{form.formState.errors.category.message}</span>}
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Date</label>
            <Input type="date" className="rounded-none h-10" {...form.register("date")} />
            {form.formState.errors.date && <span className="text-xs text-rose-500">{form.formState.errors.date.message}</span>}
          </div>

          <DialogFooter className="pt-4 border-t">
            <Button type="button" variant="outline" className="rounded-none uppercase tracking-widest text-[10px] font-bold" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="rounded-none uppercase tracking-widest text-[10px] font-bold bg-black text-white hover:bg-black/90">
              Record Transaction
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
