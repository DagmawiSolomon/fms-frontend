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
  Employee: { label: "Employee", color: "#3b82f6" },
  Manager: { label: "Manager", color: "#8b5cf6" },
  Finance: { label: "Finance", color: "#10b981" },
  Admin: { label: "Admin", color: "#f59e0b" },
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

export function AdminDashboardView() {
  return (
    <div className="flex flex-col gap-0">
      {/* Stats Section - Restored original grid/border layout */}
      <div className="grid gap-0 md:grid-cols-2 border border-b-0 rounded-none overflow-hidden">
        <Card className="rounded-none border-0 shadow-none @container/card">
          <CardHeader className="pb-2">
            <CardDescription>Total Users</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{stats.totalUsers}</CardTitle>
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
            <CardTitle className="text-3xl tabular-nums">{stats.systemHealth}</CardTitle>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[10px] text-emerald-500 flex items-center">
                <HugeiconsIcon icon={Activity01Icon} className="size-3" /> {stats.trends.health}
              </span>
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {stats.microservices.map((m) => (
              <div key={m.name} className="flex items-center gap-1.5">
                <div className={cn("size-1.5 rounded-full", m.status === "Healthy" ? "bg-emerald-500" : "bg-amber-500")} />
                <span className="text-muted-foreground">{m.name}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Graph Section - Restored separate card layout */}
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
                data={usersByRoleData}
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




