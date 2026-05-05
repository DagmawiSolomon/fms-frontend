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
import { fmsApi, normalizeCashRequests } from "@/lib/fms"
import { toast } from "sonner"

const cashRequestSchema = z.object({
  title: z.string().min(2),
  amount: z.coerce.number().positive(),
  purpose: z.string().min(2),
})

type CashRequestFormValues = z.infer<typeof cashRequestSchema>

export default function CashRequestsPage() {
  const queryClient = useQueryClient()

  const requestsQuery = useQuery({
    queryKey: ["cash-requests"],
    queryFn: async () => normalizeCashRequests(await fmsApi.getCashRequests()),
  })

  const form = useForm<CashRequestFormValues>({
    resolver: zodResolver(cashRequestSchema) as Resolver<CashRequestFormValues>,
    defaultValues: { title: "", amount: 0, purpose: "" },
  })

  const createMutation = useMutation({
    mutationFn: (values: CashRequestFormValues) => fmsApi.createCashRequest(values),
    onSuccess: async () => {
      toast.success("Cash request submitted")
      form.reset()
      await queryClient.invalidateQueries({ queryKey: ["cash-requests"] })
    },
  })

  const approveMutation = useMutation({
    mutationFn: (id: string | number) => fmsApi.approveCashRequest(id),
    onSuccess: async () => {
      toast.success("Cash request approved")
      await queryClient.invalidateQueries({ queryKey: ["cash-requests"] })
    },
  })

  const disburseMutation = useMutation({
    mutationFn: (id: string | number) => fmsApi.disburseCashRequest(id),
    onSuccess: async () => {
      toast.success("Cash request disbursed")
      await queryClient.invalidateQueries({ queryKey: ["cash-requests"] })
    },
  })

  return (
    <DashboardShell title="Cash Requests" description="Create and review cash disbursement requests">
      <div className="grid gap-4 px-4 lg:px-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>New cash request</CardTitle>
            <CardDescription>Submit request details for review</CardDescription>
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
              <Textarea placeholder="Purpose" {...form.register("purpose")} />
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Submitting..." : "Submit request"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Requests</CardTitle>
            <CardDescription>Approve or disburse from the same workflow</CardDescription>
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
                  {requestsQuery.data?.length ? (
                    requestsQuery.data.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>{request.title}</TableCell>
                        <TableCell className="text-right">
                          {formatMoney(request.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{request.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => approveMutation.mutate(request.id)}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => disburseMutation.mutate(request.id)}
                            >
                              Disburse
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        No requests found.
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
