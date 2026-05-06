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
import { fmsApi, normalizeCashRequests } from "@/lib/fms"
import { toast } from "sonner"

const cashRequestSchema = z.object({
  title: z.string().min(2, "Title is required"),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  purpose: z.string().min(2, "Purpose is required"),
})

type CashRequestFormValues = z.infer<typeof cashRequestSchema>

export default function CashRequestsPage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = React.useState(false)

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
      setDialogOpen(false)
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
    <DashboardShell
      title="Cash Requests"
      description="Submit and manage immediate funding requirements"
      actions={
        <Button onClick={() => setDialogOpen(true)}>
          <PlusIcon />
          New request
        </Button>
      }
    >
      <Card className="">
        <CardHeader>
          <CardTitle>Request ledger</CardTitle>
          <CardDescription>All cash disbursement requests and their fulfillment status</CardDescription>
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
                {requestsQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      Loading requests...
                    </TableCell>
                  </TableRow>
                ) : requestsQuery.data?.length ? (
                  requestsQuery.data.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div className="font-medium">{request.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {request.purpose}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatMoney(request.amount)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={request.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={request.status !== "pending"}
                            onClick={() => approveMutation.mutate(request.id)}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={request.status !== "approved"}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New cash request</DialogTitle>
            <DialogDescription>
              Submit request details for administrative review
            </DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-4"
            onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}
          >
            <div className="grid gap-2">
              <div className="text-sm font-medium">Title</div>
              <Input placeholder="Office Supplies" {...form.register("title")} />
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
              <div className="text-sm font-medium">Purpose</div>
              <Textarea placeholder="Describe the immediate need..." {...form.register("purpose")} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Submitting..." : "Submit request"}
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
    status === "disbursed"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
      : status === "approved"
        ? "border-blue-500/30 bg-blue-500/10 text-blue-700"
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
