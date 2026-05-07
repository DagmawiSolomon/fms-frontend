"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import type { Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  CheckIcon,
  PlusIcon,
  ShieldCheckIcon,
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
import { useRole } from "@/components/role-provider"
import { toast } from "sonner"
import type { FmsExpense } from "@/lib/fms"

const mockExpensesData: FmsExpense[] = [
  { id: "EXP-01", merchant: "Amazon Web Services", category: "Software", amount: 450.00, date: "2026-05-01", status: "verified", submitter: "Alex Torres", receiptUrl: "receipt-1.pdf" },
  { id: "EXP-02", merchant: "Delta Airlines", category: "Travel", amount: 850.50, date: "2026-05-03", status: "approved", submitter: "Marcus Webb", receiptUrl: "receipt-2.pdf" },
  { id: "EXP-03", merchant: "Whole Foods", category: "Meals", amount: 125.75, date: "2026-05-04", status: "pending", submitter: "Sarah Jenkins" },
  { id: "EXP-04", merchant: "Apple Store", category: "Hardware", amount: 2400.00, date: "2026-04-28", status: "rejected", submitter: "Diana Prince", receiptUrl: "receipt-4.pdf" },
  { id: "EXP-05", merchant: "Uber", category: "Travel", amount: 45.20, date: "2026-05-05", status: "verified", submitter: "Chris Evans", receiptUrl: "receipt-5.pdf" },
]

const expenseSchema = z.object({
  merchant: z.string().min(2, "Merchant name is required"),
  category: z.string().min(2, "Category is required"),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  date: z.string().min(8, "Date is required"),
})

type ExpenseFormValues = z.infer<typeof expenseSchema>

export default function ExpensesPage() {
  const { role } = useRole()
  
  const canCreateExpense = role !== "reports"
  const canApproveExpense = role === "manager" || role === "admin"
  const canVerifyExpense = role === "finance" || role === "admin"

  const [expenses, setExpenses] = React.useState<FmsExpense[]>(mockExpensesData)
  const [dialogOpen, setDialogOpen] = React.useState(false)

  const handleCreate = (values: ExpenseFormValues) => {
    const newExp: FmsExpense = {
      id: `EXP-${Math.floor(Math.random() * 1000)}`,
      merchant: values.merchant,
      category: values.category,
      amount: values.amount,
      date: values.date,
      status: "pending",
      submitter: "Current User",
    }
    setExpenses([newExp, ...expenses])
    toast.success("Expense submitted successfully")
    setDialogOpen(false)
  }

  const handleStatusChange = (id: string | number, status: FmsExpense["status"]) => {
    setExpenses(expenses.map(e => e.id === id ? { ...e, status } : e))
    toast.success(`Expense marked as ${status}`)
  }

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
      <Card className="rounded-b-[4px] overflow-hidden border shadow-none">
        <CardContent className="pt-6">
          <div className="overflow-hidden rounded-none border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Submitter</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.length ? (
                  expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="">
                        {expense.merchant}
                        {expense.receiptUrl && (
                          <span className="ml-2 text-xs text-muted-foreground">(Receipt attached)</span>
                        )}
                      </TableCell>
                      <TableCell>{expense.category}</TableCell>
                      <TableCell>{expense.date}</TableCell>
                      <TableCell>{expense.submitter || "Unknown"}</TableCell>
                      <TableCell className="text-right">
                        {formatMoney(expense.amount)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={expense.status} />
                      </TableCell>
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
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
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
      />
    </DashboardShell>
  )
}

function ExpenseDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: ExpenseFormValues) => void
}) {
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema) as Resolver<ExpenseFormValues>,
    defaultValues: {
      merchant: "",
      category: "",
      amount: 0,
      date: new Date().toISOString().split("T")[0],
    },
  })

  React.useEffect(() => {
    if (!open) {
      form.reset({
        merchant: "",
        category: "",
        amount: 0,
        date: new Date().toISOString().split("T")[0],
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
            label="Merchant"
            error={form.formState.errors.merchant?.message}
            control={
              <Input placeholder="Amazon, Delta, etc." {...form.register("merchant")} />
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
              label="Date"
              error={form.formState.errors.date?.message}
              control={
                <Input
                  type="date"
                  {...form.register("date")}
                />
              }
            />
          </div>
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
                  <SelectItem value="Office">Office Supplies</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            }
          />

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
    <div className="grid gap-2">
      <div className="text-sm">{label}</div>
      {control}
      {error ? <div className="text-sm text-destructive">{error}</div> : null}
    </div>
  )
}

function StatusBadge({ status }: { status: FmsExpense["status"] }) {
  const tone =
    status === "verified"
      ? "border-blue-500/30 bg-blue-500/10 text-blue-700"
      : status === "approved"
        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
        : status === "rejected"
          ? "border-rose-500/30 bg-rose-500/10 text-rose-700"
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
  }).format(value)
}
