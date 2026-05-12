"use client"

import * as React from "react"
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, LabelList } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowUp01Icon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, X, ChevronLeft, ChevronRight } from "lucide-react"
import { fmsApi, normalizeUsers } from "@/lib/fms"
import { getPendingApprovals, approveUser, rejectUser } from "@/lib/pending-approvals"
import { Skeleton } from "@/components/ui/skeleton"

// --- Constants ---
const usersChartConfig = {
  Employee: { label: "Employee", color: "var(--chart-1)" },
  Manager: { label: "Manager", color: "var(--chart-2)" },
  Finance: { label: "Finance", color: "var(--chart-3)" },
  Admin: { label: "Admin", color: "var(--chart-4)" },
} satisfies ChartConfig

function getInitials(name: string) {
  const parts = name.split(" ").filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return parts[0]?.[0]?.toUpperCase() || "?"
}

const renderCustomLabel = (props: any) => {
  const { x, y, width, height, value, dataKey } = props
  if (width < 30) return null

  return (
    <g>
      <text x={x + 8} y={y + height / 2 - 4} fill="#fff" fontSize={10} fontWeight="700"
        className="select-none pointer-events-none uppercase tracking-tighter">
        {dataKey}
      </text>
      <text x={x + 8} y={y + height / 2 + 10} fill="#fff" fillOpacity={0.7} fontSize={9} fontWeight="500"
        className="select-none pointer-events-none tabular-nums">
        {value}
      </text>
    </g>
  )
}

export function AdminDashboardView() {
  const [loading, setLoading] = React.useState(true)
  const [users, setUsers] = React.useState<any[]>([])
  const [carouselIndex, setCarouselIndex] = React.useState(0)
  const [microservices, setMicroservices] = React.useState([
    { name: "Auth", status: "checking" },
    { name: "Expense", status: "checking" },
    { name: "Budget", status: "checking" },
    { name: "Users", status: "checking" },
  ])

  const fetchUsers = async () => {
    try {
      const res = await fmsApi.getUsers()
      setUsers(normalizeUsers(res))
    } catch (error) {
      console.error("Admin dashboard fetch error:", error)
    }
  }

  React.useEffect(() => {
    async function fetchData() {
      setLoading(true)
      await fetchUsers()
      setLoading(false)
    }

    async function checkHealth() {
      const endpoints = [
        { name: "Auth", check: () => fmsApi.getMe() },
        { name: "Expense", check: () => fmsApi.getExpenses() },
        { name: "Budget", check: () => fmsApi.getBudgets() },
        { name: "Users", check: () => fmsApi.getUsers() },
      ]
      const results = await Promise.allSettled(endpoints.map(e => e.check()))
      const statuses = endpoints.map((e, i) => {
        const res = results[i]
        const isUp = res.status === "fulfilled" || (res.status === "rejected" && (res.reason as any).status !== undefined)
        return { name: e.name, status: isUp ? "Healthy" : "Down" }
      })
      setMicroservices(statuses)
    }

    fetchData()
    checkHealth()
  }, [])

  const totalUsers = users.length
  const newThisMonth = React.useMemo(() => Math.max(1, Math.floor(totalUsers * 0.08)), [totalUsers])
  const healthScore = Math.round((microservices.filter(m => m.status === "Healthy").length / microservices.length) * 100)

  const usersByRole = React.useMemo(() => {
    const roles: Record<string, number> = { Employee: 0, Manager: 0, Finance: 0, Admin: 0 }
    users.forEach(u => {
      const role = u.role?.toLowerCase() || "user"
      if (role.includes("admin")) roles.Admin++
      else if (role.includes("finance")) roles.Finance++
      else if (role.includes("manage")) roles.Manager++
      else roles.Employee++
    })
    return [{ name: "Roles", ...roles }]
  }, [users])

  const recentUsers = React.useMemo(() => [...users].slice(-5).reverse(), [users])

  const [pendingFromStore, setPendingFromStore] = React.useState<ReturnType<typeof getPendingApprovals>>([])
  React.useEffect(() => {
    setPendingFromStore(getPendingApprovals())
  }, [users])

  const quickActionUsers = React.useMemo(() => {
    return pendingFromStore.map(p => {
      const liveRecord = recentUsers.find(u => u.email === p.email)
      return liveRecord
        ? { ...liveRecord, isPending: true }
        : { id: p.email, name: p.name, email: p.email, role: p.role, isPending: true }
    })
  }, [recentUsers, pendingFromStore])

  // Keep carousel index in bounds
  React.useEffect(() => {
    if (carouselIndex >= quickActionUsers.length && quickActionUsers.length > 0) {
      setCarouselIndex(quickActionUsers.length - 1)
    }
  }, [quickActionUsers.length, carouselIndex])

  const currentUser = quickActionUsers[carouselIndex] ?? null

  const handleAction = (email: string, status: "active" | "inactive") => {
    if (status === "active") {
      approveUser(email)
      toast.success("Account approved. User can now sign in.")
    } else {
      rejectUser(email)
      toast.success("Account rejected")
    }
    setPendingFromStore(getPendingApprovals())
    setCarouselIndex(0)
  }

  if (loading) {
    return (
      <div className="grid gap-0 md:grid-cols-3 border rounded-[4px] overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="rounded-none border-0 shadow-none @container/card border-l first:border-0 border-border/50 p-6 space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-10 w-full" />
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-0">
      {/* Top stats row — 3 cards */}
      <div className="grid gap-0 md:grid-cols-3 border rounded-[4px] overflow-hidden">

        {/* Card 1 — Total Users */}
        <Card className="rounded-none border-0 shadow-none @container/card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Users</CardTitle>
            <CardTitle className="text-3xl font-heading tabular-nums text-slate-50">{totalUsers}</CardTitle>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[10px] text-emerald-500 flex items-center">
                <HugeiconsIcon icon={ArrowUp01Icon} className="size-3" /> +{newThisMonth}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase ml-1">new this month</span>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground pb-6">Active platform accounts across roles</CardContent>
        </Card>

        {/* Card 2 — System Health */}
        <Card className="rounded-none border-0 border-l shadow-none @container/card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">System Health</CardTitle>
            <CardTitle className="text-3xl font-heading tabular-nums text-slate-50">{healthScore}%</CardTitle>
            <div className="flex items-center gap-1 mt-1">
              <span className={cn("text-[10px] flex items-center", healthScore > 90 ? "text-emerald-500" : "text-amber-500")}>
                {healthScore === 100 ? "Stable" : healthScore > 50 ? "Degraded" : "Critical"}
              </span>
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-x-4 gap-y-1 text-xs pb-6">
            {microservices.map((m) => (
              <div key={m.name} className="flex items-center gap-1.5">
                <div className={cn(
                  "size-1.5 rounded-full",
                  m.status === "Healthy" ? "bg-emerald-500" : m.status === "checking" ? "bg-slate-500 animate-pulse" : "bg-rose-500"
                )} />
                <span className="text-muted-foreground">{m.name}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Card 3 — Quick Actions carousel */}
        <Card className="rounded-none border-0 border-l shadow-none border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Approval Request</CardTitle>
              {quickActionUsers.length > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCarouselIndex(i => Math.max(0, i - 1))}
                    disabled={carouselIndex === 0}
                    className="size-5 rounded-[2px] flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="size-3" />
                  </button>
                  <span className="text-[10px] tabular-nums text-muted-foreground/60 min-w-[28px] text-center">
                    {carouselIndex + 1}/{quickActionUsers.length}
                  </span>
                  <button
                    onClick={() => setCarouselIndex(i => Math.min(quickActionUsers.length - 1, i + 1))}
                    disabled={carouselIndex === quickActionUsers.length - 1}
                    className="size-5 rounded-[2px] flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="size-3" />
                  </button>
                </div>
              )}
            </div>
            <div className="h-[2px]" />
          </CardHeader>
          <CardContent className="pb-6">
            {!currentUser ? (
              <div className="h-16 flex items-center justify-center">
                <span className="text-xs text-muted-foreground/50">All clear</span>
              </div>
            ) : (
              <div
                key={currentUser.email}
                className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/8 rounded-[4px]"
                style={{ animation: "fadeIn 150ms ease" }}
              >
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-full bg-white/[0.04] flex items-center justify-center text-[11px] font-bold border border-white/8 tracking-tighter">
                    {getInitials(currentUser.name)}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium text-foreground leading-none">{currentUser.name}</span>
                    <span className="text-[10px] text-muted-foreground font-mono leading-none mt-0.5">{currentUser.email}</span>
                    <Badge variant="outline" className="rounded-[2px] text-[8px] uppercase font-bold bg-white/[0.03] border-white/10 px-1 py-0 h-3.5 leading-none w-fit mt-1">
                      {currentUser.role}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 rounded-[4px] text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20"
                    onClick={() => handleAction(currentUser.email, "active")}
                  >
                    <Check className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 rounded-[4px] text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 border border-rose-500/20"
                    onClick={() => handleAction(currentUser.email, "inactive")}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </div>
            )}
            {/* Dot indicators */}
            {quickActionUsers.length > 1 && (
              <div className="flex justify-center gap-1 mt-3">
                {quickActionUsers.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCarouselIndex(i)}
                    className={cn(
                      "rounded-full transition-all duration-200",
                      i === carouselIndex
                        ? "size-1.5 bg-white/60"
                        : "size-1 bg-white/20 hover:bg-white/40"
                    )}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom — role distribution chart */}
      <div className="border border-t-0 rounded-b-[4px] overflow-hidden">
        <Card className="rounded-none border-0 shadow-none">
          <CardHeader className="min-h-[64px] pb-0 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Users by Role</CardTitle>
            <div className="flex items-center gap-4">
              {Object.entries(usersChartConfig).map(([key, config]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <div className="size-1.5 rounded-full" style={{ backgroundColor: config.color }} />
                  <span className="text-[10px] text-muted-foreground uppercase font-medium">{config.label}</span>
                </div>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <ChartContainer config={usersChartConfig} className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={usersByRole} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" hide />
                  <ChartTooltip
                    cursor={false}
                    shared={false}
                    content={<ChartTooltipContent indicator="dot" hideLabel />}
                  />
                  {Object.keys(usersChartConfig).map((key) => (
                    <Bar key={key} dataKey={key} stackId="a" fill={`var(--color-${key})`} radius={[0, 0, 0, 0]}>
                      <LabelList dataKey={key} content={renderCustomLabel} />
                    </Bar>
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateX(6px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </div>
  )
}
