"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import type { Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  BanknoteIcon,
  CheckIcon,
  PlusIcon,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useRole } from "@/components/role-provider"
import { toast } from "sonner"
import type { FmsCashRequest } from "@/lib/fms"

const mockRequestsData: FmsCashRequest[] = [
  { id: "REQ-01", title: "New Developer Laptops", amount: 4500, status: "pending", purpose: "Equipment upgrade for engineering team", requestedBy: "Sarah Jenkins" },
  { id: "REQ-02", title: "Q2 Ad Spend Advance", amount: 12000, status: "approved", purpose: "Facebook & Google ads", requestedBy: "Marcus Webb" },
  { id: "REQ-03", title: "Office Snacks", amount: 500, status: "disbursed", purpose: "Monthly breakroom restock", requestedBy: "Alex Torres" },
  { id: "REQ-04", title: "Team Offsite Travel", amount: 3500, status: "rejected", purpose: "Flights to Vegas", requestedBy: "Diana Prince" },
  { id: "REQ-05", title: "Software Subscriptions", amount: 800, status: "pending", purpose: "Annual renewal for design tools", requestedBy: "Chris Evans" },
]

const requestSchema = z.object({
  title: z.string().min(2, "Request title is required"),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  purpose: z.string().min(5, "Purpose is required"),
})

type RequestFormValues = z.infer<typeof requestSchema>

export default function CashRequestsPage() {
  const { role } = useRole()
  
  const canCreateRequest = role !== "reports"
  const canApproveRequest = role === "manager" || role === "admin"
  const canDisburseRequest = role === "finance" || role === "admin"

  const [requests, setRequests] = React.useState<FmsCashRequest[]>(mockRequestsData)
  const [dialogOpen, setDialogOpen] = React.useState(false)

  const handleCreate = (values: RequestFormValues) => {
    const newReq: FmsCashRequest = {
      id: `REQ-${Math.floor(Math.random() * 1000)}`,
      title: values.title,
      amount: values.amount,
      purpose: values.purpose,
      status: "pending",
      requestedBy: "Current User",
    }
    setRequests([newReq, ...requests])
    toast.success("Cash request submitted successfully")
    setDialogOpen(false)
  }

  const handleStatusChange = (id: string | number, status: FmsCashRequest["status"]) => {
    setRequests(requests.map(r => r.id === id ? { ...r, status } : r))
    toast.success(`Request marked as ${status}`)
  }

  return (
    <DashboardShell
      title="Cash requests"
      description="Monitor and approve pending advance funding requests."
      actions={
        canCreateRequest ? (
          <Button onClick={() => setDialogOpen(true)}>
            <PlusIcon className="mr-2 size-4" />
            New request
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
                  <TableHead>Request</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.length ? (
                  requests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">{req.title}</TableCell>
                      <TableCell className="max-w-[250px] truncate text-muted-foreground">
                        {req.purpose || "No details"}
                      </TableCell>
                      <TableCell>{req.requestedBy || "Unknown"}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatMoney(req.amount)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={req.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          {canApproveRequest && req.status === "pending" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStatusChange(req.id, "approved")}
                              >
                                <CheckIcon className="size-4" />
                                <span className="sr-only">Approve</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStatusChange(req.id, "rejected")}
                              >
                                <XIcon className="size-4" />
                                <span className="sr-only">Reject</span>
                              </Button>
                            </>
                          )}
                          {canDisburseRequest && req.status === "approved" && (
                            <Button
                              variant="default"
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={() => handleStatusChange(req.id, "disbursed")}
                            >
                              <BanknoteIcon className="mr-2 size-4" />
                              Disburse
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No cash requests found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <RequestDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreate}
      />
    </DashboardShell>
  )
}

function RequestDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: RequestFormValues) => void
}) {
  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema) as Resolver<RequestFormValues>,
    defaultValues: {
      title: "",
      amount: 0,
      purpose: "",
    },
  })

  React.useEffect(() => {
    if (!open) {
      form.reset()
    }
  }, [form, open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create cash request</DialogTitle>
          <DialogDescription>
            Submit a new request for advance funding
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-4"
          onSubmit={form.handleSubmit((values) =>
            onSubmit(values as RequestFormValues)
          )}
        >
          <Field
            label="Title"
            error={form.formState.errors.title?.message}
            control={
              <Input placeholder="Office equipment" {...form.register("title")} />
            }
          />
          <Field
            label="Amount needed"
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
            label="Purpose"
            error={form.formState.errors.purpose?.message}
            control={
              <Input
                placeholder="Reason for funding..."
                {...form.register("purpose")}
              />
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
            <Button type="submit">Submit request</Button>
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

function StatusBadge({ status }: { status: FmsCashRequest["status"] }) {
  const tone =
    status === "approved"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
      : status === "disbursed"
        ? "border-blue-500/30 bg-blue-500/10 text-blue-700"
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
    maximumFractionDigits: 0,
  }).format(value)
}
