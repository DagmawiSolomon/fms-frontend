"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import type { Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"
import { PlusIcon } from "lucide-react"

import { DashboardShell } from "@/components/dashboard-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { fmsApi, normalizeExpenses } from "@/lib/fms"
import { toast } from "sonner"

const expenseSchema = z.object({
  title: z.string().min(2, "Title is required"),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  category: z.string().min(2, "Category is required"),
  notes: z.string().optional(),
})

type ExpenseFormValues = z.infer<typeof expenseSchema>

export default function ExpensesPage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = React.useState(false)

  const expensesQuery = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => normalizeExpenses(await fmsApi.getExpenses()),
  })

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema) as Resolver<ExpenseFormValues>,
    defaultValues: { title: "", amount: 0, category: "", notes: "" },
  })

  const createMutation = useMutation({
    mutationFn: (values: ExpenseFormValues) => fmsApi.createExpense(values),
    onSuccess: async () => {
      toast.success("Expense created")
      form.reset()
      setDialogOpen(false)
      await queryClient.invalidateQueries({ queryKey: ["expenses"] })
    },
  })

  const verifyMutation = useMutation({
    mutationFn: (id: string | number) => fmsApi.verifyExpense(id),
    onSuccess: async () => {
      toast.success("Expense verified")
      await queryClient.invalidateQueries({ queryKey: ["expenses"] })
    },
  })

  return (
    <DashboardShell
      title="Expenses"
      description="Record expenditures and verify receipts"
    >
      <div className="flex justify-start mb-4">
        <Button onClick={() => setDialogOpen(true)}>
          <PlusIcon />
          Add expense
        </Button>
      </div>

      <Card className="">
        <CardHeader>
          <CardTitle>Expense ledger</CardTitle>
          <CardDescription>All recorded expenditures and their current verification status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expensesQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      Loading expenses...
                    </TableCell>
                  </TableRow>
                ) : expensesQuery.data?.length ? (
                  expensesQuery.data.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>
                        <div className="font-medium">{expense.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {expense.category || "General"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatMoney(expense.amount)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={expense.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={expense.status === "verified"}
                          onClick={() => verifyMutation.mutate(expense.id)}
                        >
                          Verify
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No expenses found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add expense</DialogTitle>
            <DialogDescription>
              Submit a new expense line with category and notes
            </DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-4"
            onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}
          >
            <div className="grid gap-2">
              <div className="text-sm font-medium">Title</div>
              <Input placeholder="Team Lunch" {...form.register("title")} />
            </div>
            <div className="grid gap-2">
              <div className="text-sm font-medium">Amount</div>
              <Input
                placeholder="0.00"
                type="number"
                min="0"
                step="0.01"
                {...form.register("amount")}
              />
            </div>
            <div className="grid gap-2">
              <div className="text-sm font-medium">Category</div>
              <Input placeholder="Meals & Entertainment" {...form.register("category")} />
            </div>
            <div className="grid gap-2">
              <div className="text-sm font-medium">Notes</div>
              <Textarea placeholder="Optional details..." {...form.register("notes")} />
            </div>
            <div className="grid gap-2">
              <div className="text-sm font-medium">Receipt</div>
              <Input type="file" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Saving..." : "Add expense"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "verified"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
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
