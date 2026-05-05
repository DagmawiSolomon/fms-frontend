"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import type { Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"

import { DashboardShell } from "@/components/dashboard-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { fmsApi, normalizeExpenses } from "@/lib/fms"
import { toast } from "sonner"

const expenseSchema = z.object({
  title: z.string().min(2),
  amount: z.coerce.number().positive(),
  category: z.string().min(2),
  notes: z.string().optional(),
})

type ExpenseFormValues = z.infer<typeof expenseSchema>

export default function ExpensesPage() {
  const queryClient = useQueryClient()

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
    <DashboardShell title="Expenses" description="Create expenses, attach receipts, and verify entries">
      <div className="grid gap-4 px-4 lg:px-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Create expense</CardTitle>
            <CardDescription>Use this form to submit a new expense line</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4"
              onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}
            >
              <Input placeholder="Title" {...form.register("title")} />
              <Input
                placeholder="Amount"
                type="number"
                min="0"
                step="0.01"
                {...form.register("amount")}
              />
              <Input placeholder="Category" {...form.register("category")} />
              <Textarea placeholder="Notes" {...form.register("notes")} />
              <Input type="file" />
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Saving..." : "Submit expense"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expense queue</CardTitle>
            <CardDescription>Verify receipts and lock the spend record</CardDescription>
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
                  {expensesQuery.data?.length ? (
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
                          <Badge variant="outline">{expense.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
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
      </div>
    </DashboardShell>
  )
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value)
}
