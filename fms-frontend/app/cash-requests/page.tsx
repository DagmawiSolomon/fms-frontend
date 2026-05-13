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
  ArrowUpRight,
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
import { fmsApi, normalizeCashRequests, filterByDepartment, filterByOwnership } from "@/lib/fms"
import type { FmsCashRequest } from "@/lib/fms"
import { Skeleton } from "@/components/ui/skeleton"
import { getUserFromCache } from "@/lib/user-cache"
import { isFinanceLeadershipEmail } from "@/lib/auth"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { CalendarIcon, UserIcon, BriefcaseIcon, DollarSignIcon, FileTextIcon } from "lucide-react"


const requestSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  purpose: z.string().min(5, "Please provide a detailed purpose (min 5 characters)"),
})

type RequestFormValues = z.infer<typeof requestSchema>

import { useRouter } from "next/navigation"

export default function CashRequestsPage() {
  const { user, role, config, hasPermission } = useRole()
  const router = useRouter()

  React.useEffect(() => {
    if (!config.navigation.includes("Cash Requests")) {
      router.push("/dashboard")
    }
  }, [config, router])
  
  const canCreateRequest = hasPermission("cash_requests.create")
  const canApproveRequest = hasPermission("cash_requests.approve")

  const [requests, setRequests] = React.useState<FmsCashRequest[]>([])
  const [loading, setLoading] = React.useState(true)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [departmentFilter, setDepartmentFilter] = React.useState("all")
  const [selectedUserProfile, setSelectedUserProfile] = React.useState<any | null>(null)

  const fetchRequests = React.useCallback(async () => {
    try {
      setLoading(true)
      const data = await fmsApi.getCashRequests()
      let normalized = normalizeCashRequests(data)
      
      // Enforce department isolation and ownership
      normalized = role === "employee"
        ? filterByOwnership(normalized, user)
        : filterByDepartment(normalized, user, role)

      setRequests(normalized)
    } catch (error) {
      console.error("Failed to fetch cash requests:", error)
    } finally {
      setLoading(false)
    }
  }, [user, role])

  React.useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const totals = requests.reduce((acc, req) => {
    acc.total += req.amount
    if (req.status === "pending") acc.pending += req.amount
    if (req.status === "approved") acc.approved += req.amount
    if (req.status === "disbursed") acc.disbursed += req.amount
    return acc
  }, { total: 0, pending: 0, approved: 0, disbursed: 0 })

  const filteredRequests = requests.filter(req => {
    const matchesSearch = (req.title?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) || 
                         String(req.id).toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || req.status === statusFilter
    const matchesDept = departmentFilter === "all" || req.department === departmentFilter
    return matchesSearch && matchesStatus && matchesDept
  })

  const handleCreate = async (values: RequestFormValues) => {
    try {
      const response = await fmsApi.createCashRequest({
        purpose: values.purpose,
        amount: values.amount,
        userId: user?.id as string | undefined,
        department: user?.department as string | undefined,
      } as any)
      toast.success("Cash request submitted successfully")
      setDialogOpen(false)
      
      const newRequests = normalizeCashRequests([response])
      if (newRequests.length > 0) {
        setRequests((prev) => [newRequests[0], ...prev])
      }
      
      fetchRequests()
    } catch (error) {
      toast.error("Failed to submit cash request. Please try again.")
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
      toast.error("Failed to update request status.")
    }
  }

  const isLeadership = isFinanceLeadershipEmail(user?.email)
  const canDisburseRequest = hasPermission("cash_requests.disburse") && !isLeadership
  const showActions = canApproveRequest || canDisburseRequest
  const showRequesterColumn = role !== "employee"

  return (
    <DashboardShell
      title="Cash requests"
      description="Monitor pending advance funding requests through approval and disbursement."
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
          label="Total requests"
          value={totals.total}
          description="Total funds requested in the current period"
          isFirst
          trend={{ value: `${filteredRequests.length}`, isUp: true }}
          trendLabel="total items"
          loading={loading}
        />
        <SummaryCard
          label="Disbursed total"
          value={totals.disbursed}
          description="Funds successfully paid out"
          trend={{ value: `${filteredRequests.filter(r => r.status === "disbursed").length}`, isUp: true }}
          trendLabel="disbursed requests"
          loading={loading}
        />
        <SummaryCard
          label="Pending approval"
          value={totals.pending}
          description="Funds still awaiting approval"
          trend={{ 
            value: `${((totals.pending / (totals.total || 1)) * 100).toFixed(1)}%`, 
            isUp: false 
          }}
          trendLabel="of total volume"
          loading={loading}
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
              {(role === "admin" || role === "finance" || isLeadership) && (
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="w-[160px]">
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
              )}
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
                  <TableHead className="text-right text-xs text-muted-foreground/50">Amount</TableHead>
                  {showRequesterColumn && <TableHead className="text-xs text-muted-foreground/50">Requester</TableHead>}
                  <TableHead className="text-xs text-muted-foreground/50">Status</TableHead>
                  {showActions && <TableHead className="text-right text-xs text-muted-foreground/50">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-[80px] ml-auto" /></TableCell>
                      {showRequesterColumn && <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>}
                      <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                      {showActions && <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>}
                    </TableRow>
                  ))
                ) : filteredRequests.length ? (
                  filteredRequests.map((req) => (
                    <TableRow 
                      key={req.id}
                    >
                      <TableCell className="text-sm font-normal text-foreground">{req.title}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground">
                        {req.purpose || "No details"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(req.amount)}
                      </TableCell>
                      {showRequesterColumn && (
                        <TableCell>
                          <button
                            onClick={() => setSelectedUserProfile(getUserFromCache(req.requestedBy))}
                            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
                          >
                            {getUserFromCache(req.requestedBy)?.name || "Unknown"}
                            <ArrowUpRight className="size-3" />
                          </button>
                        </TableCell>
                      )}
                      <TableCell>
                        <StatusBadge status={req.status} />
                      </TableCell>
                      {showActions && (
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-2">
                            {canApproveRequest && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="disabled:cursor-not-allowed"
                                onClick={() => handleStatusChange(req.id, "approved")}
                                disabled={req.status !== "pending"}
                              >
                                <CheckIcon className="size-4" />
                                <span className="sr-only">Approve</span>
                              </Button>
                            )}
                            {canDisburseRequest && (
                              <Button
                                variant="default"
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white disabled:cursor-not-allowed"
                                onClick={() => handleStatusChange(req.id, "disbursed")}
                                disabled={req.status !== "approved"}
                              >
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
                    <TableCell colSpan={showActions ? (showRequesterColumn ? 5 : 4) : (showRequesterColumn ? 4 : 3)} className="h-24 text-center">
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

      <Sheet open={!!selectedUserProfile} onOpenChange={(open) => !open && setSelectedUserProfile(null)}>
        <SheetContent className="flex flex-col gap-0 p-0">
          {selectedUserProfile && (
            <>
              <SheetHeader className="p-6 border-b border-border/50">
                <SheetTitle>User Profile</SheetTitle>
                <SheetDescription>
                  Detailed information about the requester and their organizational role.
                </SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto">
                <div className="grid gap-6 p-6">
                  {/* Cloned User Profile UI from users/page.tsx */}
                  <div className="flex items-center gap-4 py-2">
                    <Avatar className="h-12 w-12 rounded-full grayscale border border-border/50">
                      <AvatarFallback className="rounded-full">
                        {selectedUserProfile.name?.split(" ").map((n: string) => n[0]).join("") || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-base font-medium text-foreground">{selectedUserProfile.name}</span>
                      <span className="text-xs text-muted-foreground">{selectedUserProfile.email}</span>
                    </div>
                  </div>

                  <Separator className="bg-border/50" />

                  <div className="grid gap-6">
                    <Info label="System Role" value={<span className="capitalize">{selectedUserProfile.role}</span>} />

                    <Info label="Department" value={selectedUserProfile.department || "General"} />

                    <Info 
                      label="Status" 
                      value={
                        <div className="flex items-center gap-2">
                          <span className="capitalize">{selectedUserProfile.status || "active"}</span>
                          <div className={cn(
                            "size-1.5 rounded-full",
                            (selectedUserProfile.status || "active") === "active" ? "bg-emerald-500" : "bg-slate-500"
                          )} />
                        </div>
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-border/50 bg-white/[0.01]">
                <Button 
                  variant="outline"
                  className="w-full rounded-[4px] h-10" 
                  onClick={() => setSelectedUserProfile(null)}
                >
                  Close Profile
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
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
            label="Amount needed"
            error={form.formState.errors.amount?.message}
            control={
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 500"
                {...form.register("amount", { valueAsNumber: true })}
              />
            }
          />
          <Field
            label="Purpose"
            error={form.formState.errors.purpose?.message}
            control={
              <Input
                placeholder="Reason for the cash advance..."
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
  loading,
  trend,
  trendLabel,
}: {
  label: string
  value: number
  description: string
  isFirst?: boolean
  loading?: boolean
  trend?: {
    value: string
    isUp: boolean
  }
  trendLabel?: string
}) {
  if (loading) {
    return (
      <Card className={cn(
        "rounded-none border-b-0 border-r-0 border-t-0 shadow-none @container/card border-border/50",
        !isFirst && "border-l"
      )}>
        <CardHeader className="pb-2 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-3 w-full" />
        </CardContent>
      </Card>
    )
  }

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

function Info({ label, value, labelClassName }: { label: string; value: React.ReactNode; labelClassName?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className={cn("text-xs font-heading text-muted-foreground/50", labelClassName)}>{label}</div>
      <div className="text-sm text-foreground">{value}</div>
    </div>
  )
}
