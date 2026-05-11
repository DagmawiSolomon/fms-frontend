"use client"

import * as React from "react"
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, Cell, LabelList } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowUp01Icon, Activity01Icon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"

// --- Mock Data ---
const stats = {
  totalUsers: 142,
  systemHealth: "99.8%",
  trends: {
    users: "+12",
    health: "Stable"
  },
  microservices: [
    { name: "Auth", status: "Healthy" },
    { name: "Expense", status: "Healthy" },
    { name: "Budget", status: "Degraded" },
    { name: "Notification", status: "Healthy" },
  ]
}

const usersByRoleData = [
  {
    name: "Roles",
    Employee: 105,
    Manager: 22,
    Finance: 12,
    Admin: 3
  },
]

const usersChartConfig = {
  Employee: { label: "Employee", color: "var(--chart-1)" },
  Manager: { label: "Manager", color: "var(--chart-2)" },
  Finance: { label: "Finance", color: "var(--chart-3)" },
  Admin: { label: "Admin", color: "var(--chart-4)" },
} satisfies ChartConfig

const renderCustomLabel = (props: any) => {
  const { x, y, width, height, value, dataKey } = props
  if (width < 30) return null // Even smaller threshold since we want to show Admin

  return (
    <g>
      <text
        x={x + 8}
        y={y + height / 2 - 4}
        fill="#fff"
        fontSize={10}
        fontWeight="700"
        className="select-none pointer-events-none uppercase tracking-tighter"
      >
        {dataKey}
      </text>
      <text
        x={x + 8}
        y={y + height / 2 + 10}
        fill="#fff"
        fillOpacity={0.7}
        fontSize={9}
        fontWeight="500"
        className="select-none pointer-events-none tabular-nums"
      >
        {value}
      </text>
    </g>
  )
}

import { fmsApi, normalizeUsers } from "@/lib/fms"

export function AdminDashboardView() {
  const [loading, setLoading] = React.useState(true)
  const [users, setUsers] = React.useState<any[]>([])
  const [microservices, setMicroservices] = React.useState([
    { name: "Auth", status: "checking" },
    { name: "Expense", status: "checking" },
    { name: "Budget", status: "checking" },
    { name: "Users", status: "checking" },
  ])

  React.useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const res = await fmsApi.getUsers()
        setUsers(normalizeUsers(res))
      } catch (error) {
        console.error("Admin dashboard fetch error:", error)
      } finally {
        setLoading(false)
      }
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
        // If it succeeded or returned any status code (even 401/403), the service is up.
        // If it's a network error (no status), then it's down.
        const isUp = res.status === "fulfilled" || (res.status === "rejected" && (res.reason as any).status !== undefined)
        return { name: e.name, status: isUp ? "Healthy" : "Down" }
      })

      setMicroservices(statuses)
    }

    fetchData()
    checkHealth()
  }, [])

  const totalUsers = users.length
  const healthScore = Math.round((microservices.filter(m => m.status === "Healthy").length / microservices.length) * 100)
  
  const usersByRole = React.useMemo(() => {
    const roles: Record<string, number> = {
      Employee: 0,
      Manager: 0,
      Finance: 0,
      Admin: 0
    }
    
    users.forEach(u => {
      const role = u.role?.toLowerCase() || "user"
      if (role.includes("admin")) roles.Admin++
      else if (role.includes("finance")) roles.Finance++
      else if (role.includes("manage")) roles.Manager++
      else roles.Employee++
    })
    
    return [{ name: "Roles", ...roles }]
  }, [users])

  if (loading) {
    return (
      <div className="grid gap-0 md:grid-cols-2 border border-b-0 rounded-none overflow-hidden animate-pulse">
        <div className="h-32 bg-white/5" />
        <div className="h-32 bg-white/5 border-l border-border/50" />
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-0">
      {/* Stats Section - Restored original grid/border layout */}
      <div className="grid gap-0 md:grid-cols-2 border border-b-0 rounded-none overflow-hidden">
        <Card className="rounded-none border-0 shadow-none @container/card">
          <CardHeader className="pb-2">
            <CardDescription>Total Users</CardDescription>
            <CardTitle className="text-3xl font-heading tabular-nums text-slate-50">{totalUsers}</CardTitle>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[10px] text-emerald-500 flex items-center">
                <HugeiconsIcon icon={ArrowUp01Icon} className="size-3" /> {stats.trends.users}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase">this month</span>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Active platform accounts across roles</CardContent>
        </Card>
        <Card className="rounded-none border-b-0 border-r-0 border-t-0 shadow-none @container/card border-l border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>System Health</CardDescription>
            <CardTitle className="text-3xl font-heading tabular-nums text-slate-50">{healthScore}%</CardTitle>
            <div className="flex items-center gap-1 mt-1">
              <span className={cn("text-[10px] flex items-center", healthScore > 90 ? "text-emerald-500" : "text-amber-500")}>
                {healthScore === 100 ? "Stable" : healthScore > 50 ? "Degraded" : "Critical"}
              </span>
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
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
      </div>

      <Card className="rounded-none overflow-hidden border shadow-none">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex flex-col gap-1">
            <CardTitle>Users by Role</CardTitle>
          </div>
          <CardAction>
            <div className="flex items-center gap-4">
              {Object.entries(usersChartConfig).map(([key, config]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className="size-2 rounded-full" style={{ backgroundColor: config.color }} />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{config.label}</span>
                </div>
              ))}
            </div>
          </CardAction>
        </CardHeader>
        <CardContent className="p-6">
          <ChartContainer config={usersChartConfig} className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={usersByRole}
                layout="vertical"
                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
              >
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" hide />
                <ChartTooltip
                  cursor={false}
                  shared={false}
                  content={<ChartTooltipContent indicator="dot" hideLabel />}
                />
                {Object.keys(usersChartConfig).map((key) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    stackId="a"
                    fill={`var(--color-${key})`}
                    radius={[0, 0, 0, 0]}
                  >
                    <LabelList dataKey={key} content={renderCustomLabel} />
                  </Bar>
                ))}
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}




