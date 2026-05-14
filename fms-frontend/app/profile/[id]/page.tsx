"use client"

import * as React from "react"
import { use } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ArrowDownIcon, ArrowUpIcon, CheckIcon, SearchIcon, AlertCircleIcon, FileTextIcon, WalletIcon, XIcon } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

function formatNameFromSlug(slug: string) {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value)
}

import { fmsApi, normalizeSessionUser, type FmsSessionUser } from "@/lib/fms"

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [profile, setProfile] = React.useState<FmsSessionUser | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")

  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const data = await fmsApi.getProfile(resolvedParams.id)
        setProfile(normalizeSessionUser(data))
      } catch (error) {
        console.error("Failed to fetch profile:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [resolvedParams.id])

  const name = profile?.name ?? (resolvedParams.id === "me" ? "My Profile" : `User ${resolvedParams.id.slice(-6)}`)
  const email = profile?.email ?? (resolvedParams.id === "me" ? "Loading..." : "Email not available")

  const stats = {
    totalSpent: 0,
    pendingCount: 0,
    avgTransaction: 0,
    complianceScore: 100,
  }

  const transactions: any[] = []

  const filteredTransactions = transactions.filter(t =>
    (t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (statusFilter === "all" || t.status === statusFilter)
  )

  if (loading) {
    return (
      <DashboardShell
        title="Employee Profile"
        description="Loading profile details..."
      >
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-muted-foreground text-sm">Loading profile data...</p>
          </div>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell
      title="Employee Profile"
      description={`Viewing management profile and activity for ${name}.`}
      breadcrumbs={[
        { label: "Users", href: "/users" },
        { label: name }
      ]}
    >
      <div className="flex flex-col gap-0">

        {/* User Identity Card */}
        <Card className="rounded-t-[4px] rounded-b-none border border-b-0 shadow-none">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24 rounded-full border border-border/50">
                  <AvatarFallback className="rounded-full text-2xl bg-muted text-muted-foreground" seed={email} name={name} />
                </Avatar>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h2 className="text-3xl tracking-tight text-foreground font-heading">{name}</h2>
                    <Badge variant="outline" className="rounded-[4px] bg-black border-border text-muted-foreground font-normal">
                      Active
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                    <span>{email}</span>
                    <span>Department: {profile?.department ?? "Not set"}</span>
                  </div>
                </div>
              </div>


            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid gap-0 md:grid-cols-3 border border-b-0 rounded-none overflow-hidden">
          <SummaryCard
            label="YTD Expenditures"
            value={stats.totalSpent > 0 ? formatMoney(stats.totalSpent) : "0"}
            description="Total value of approved requests"
            isFirst
          />
          <SummaryCard
            label="Pending Requests"
            value={stats.pendingCount.toString()}
            description="Awaiting verification"
          />
          <SummaryCard
            label="Avg. Transaction"
            value={stats.avgTransaction > 0 ? formatMoney(stats.avgTransaction) : "0"}
            description="Mean value per request"
          />

        </div>

        {/* Recent Activity Table */}
        <Card className="rounded-b-[4px] rounded-t-none overflow-hidden border shadow-none">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Filter transactions..."
                  className="pl-9 h-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px] h-9">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length ? (
                    filteredTransactions.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>
                          <div className="text-sm font-normal text-foreground">{t.description}</div>
                        </TableCell>
                        <TableCell>{t.category}</TableCell>
                        <TableCell className="text-xs">{t.date}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatMoney(t.amount)}</TableCell>
                        <TableCell>
                          <StatusBadge status={t.status as any} />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
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
    </DashboardShell>
  )
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-xs text-muted-foreground/50">{label}</div>
      <div className="text-sm text-foreground">{value}</div>
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
  value: string | number
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
          {value}
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

function StatusBadge({ status }: { status: "pending" | "verified" | "rejected" }) {
  let tone = "border-amber-500/20 text-amber-500";
  if (status === "verified") tone = "border-emerald-500/20 text-emerald-500";
  if (status === "rejected") tone = "border-rose-500/20 text-rose-500";

  return (
    <Badge variant="outline" className={cn(tone, "rounded-[4px] bg-black capitalize font-medium")}>
      {status}
    </Badge>
  )
}
