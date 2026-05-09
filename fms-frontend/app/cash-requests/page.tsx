"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import type { Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BanknoteIcon,
  CheckIcon,
  PlusIcon,
  SearchIcon,
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
import { fmsApi, normalizeCashRequests } from "@/lib/fms"
import type { FmsCashRequest } from "@/lib/fms"


const requestSchema = z.object({
  title: z.string().min(2, "Request title is required"),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  purpose: z.string().min(5, "Purpose is required"),
  budgetId: z.string().optional(),
})

type RequestFormValues = z.infer<typeof requestSchema>

export default function CashRequestsPage() {
  const { role, hasPermission } = useRole()
  
  const canCreateRequest = hasPermission("cash_requests.create")
  const canApproveRequest = hasPermission("cash_requests.approve")
  const canDisburseRequest = hasPermission("cash_requests.disburse")

  const [requests, setRequests] = React.useState<FmsCashRequest[]>([])
  const [loading, setLoading] = React.useState(true)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")

  const fetchRequests = React.useCallback(async () => {
    try {
      setLoading(true)
      const data = await fmsApi.getCashRequests()
      setRequests(normalizeCashRequests(data))
    } catch (error) {
      console.error("Failed to fetch cash requests:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const totals = requests.reduce((acc, req) => {
    acc.total += req.amount
    if (req.status === "pending") acc.pending += req.amount
    if (req.status === "approved" || req.status === "disbursed") acc.approved += req.amount
    return acc
  }, { total: 0, pending: 0, approved: 0 })

  const filteredRequests = requests.filter(req => {
    const matchesSearch = (req.title?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) || 
                         String(req.id).toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || req.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleCreate = async (values: RequestFormValues) => {
    try {
      await fmsApi.createCashRequest({
        ...values,
        purpose: values.purpose
      })
      toast.success("Cash request submitted successfully")
      setDialogOpen(false)
      fetchRequests()
    } catch (error) {
      // Handled in apiRequest
    }
  }

  const handleStatusChange = async (id: string | number, status: FmsCashRequest["status"]) => {
    try {
      if (status === "approved") {
        await fmsApi.approveCashRequest(id)
      } else if (status === "disbursed") {
        await fmsApi.disburseCashRequest(id)
      }
      toast.success(`Request marked as ${status}`)
      fetchRequests()
    } catch (error) {
      // Handled in apiRequest
    }
  }

  const showActions = canApproveRequest || canDisburseRequest

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
      <div className="grid gap-0 md:grid-cols-3 border border-b-0 rounded-none overflow-hidden">
        <SummaryCard
          label="Total Requested"
          value={totals.total}
          description="Cumulative value of all cash requests"
          isFirst
          trend={{ value: "+5.4%", isUp: true }}
          trendLabel="from last month"
        />
        <SummaryCard
          label="Pending Amount"
          value={totals.pending}
          description="Funds currently awaiting approval"
          trend={{ value: "+3", isUp: true }}
          trendLabel="requests today"
        />
        <SummaryCard
          label="Disbursed"
          value={totals.approved}
          description="Total cash released this period"
          trend={{ value: "+18.2%", isUp: true }}
          trendLabel="vs last month"
        />
      </div>

      <Card className="rounded-b-[4px] overflow-hidden border shadow-none">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-2.5 top-1.5 size-4 text-muted-foreground" />
              <Input 
                placeholder="Search requests..." 
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="disbursed">Disbursed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-hidden rounded-none">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs text-muted-foreground/50">Request</TableHead>
                  <TableHead className="text-xs text-muted-foreground/50">Purpose</TableHead>
                  <TableHead className="text-xs text-muted-foreground/50">Requested By</TableHead>
                  <TableHead className="text-right text-xs text-muted-foreground/50">Amount</TableHead>
                  <TableHead className="text-xs text-muted-foreground/50">Status</TableHead>
                  {showActions && <TableHead className="text-right text-xs text-muted-foreground/50">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.length ? (
                  filteredRequests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="text-sm font-normal text-foreground">{req.title}</TableCell>
                      <TableCell className="max-w-[250px] truncate text-muted-foreground">
                        {req.purpose || "No details"}
                      </TableCell>
                      <TableCell>{req.requestedBy || "Unknown"}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(req.amount)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={req.status} />
                      </TableCell>
                      {showActions && (
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
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={showActions ? 6 : 5} className="h-24 text-center">
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
            label="Linked Budget"
            error={form.formState.errors.budgetId?.message}
            control={
              <Select
                value={form.watch("budgetId")}
                onValueChange={(value) =>
                  form.setValue("budgetId", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a budget (Optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Out-of-budget)</SelectItem>
                  <SelectItem value="BUD-01">Q1 Engineering Ops</SelectItem>
                  <SelectItem value="BUD-02">Global Marketing</SelectItem>
                </SelectContent>
              </Select>
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
    <div className="grid gap-1.5">
      <div className="text-xs text-muted-foreground/60">{label}</div>
      {control}
      {error ? <div className="text-xs text-destructive">{error}</div> : null}
    </div>
  )
}

function StatusBadge({ status }: { status: FmsCashRequest["status"] }) {
  const tone =
    status === "approved"
      ? "border-emerald-500/20 text-emerald-500"
      : status === "disbursed"
        ? "border-blue-500/20 text-blue-400"
        : status === "rejected"
          ? "border-rose-500/20 text-rose-500"
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
