"use client"

import * as React from "react"
import { Pie, PieChart, Cell, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

// --- Mock Data ---
const stats = {
  totalUsers: 142,
  usersByRole: "4 Roles",
}

const usersByRoleData = [
  { role: "Employee", count: 105, fill: "#3b82f6" }, // blue-500
  { role: "Manager", count: 22, fill: "#8b5cf6" },  // violet-500
  { role: "Finance", count: 12, fill: "#10b981" },  // emerald-500
  { role: "Admin", count: 3, fill: "#f59e0b" },     // amber-500
]

const usersChartConfig = {
  employee: { label: "Employee", color: "#3b82f6" },
  manager: { label: "Manager", color: "#8b5cf6" },
  finance: { label: "Finance", color: "#10b981" },
  admin: { label: "Admin", color: "#f59e0b" },
} satisfies ChartConfig

export function AdminDashboardView() {
  return (
    <div className="flex flex-col gap-0">
      <div className="grid gap-0 md:grid-cols-2 border border-b-0 rounded-none overflow-hidden">
        <Card className="rounded-none border-0 shadow-none @container/card">
          <CardHeader className="pb-2">
            <CardDescription>Total Users</CardDescription>
            <CardTitle className="text-3xl font-medium tabular-nums">{stats.totalUsers}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Active platform accounts</CardContent>
        </Card>
        <Card className="rounded-none border-b-0 border-r-0 border-t-0 shadow-none @container/card border-l border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>User Roles</CardDescription>
            <CardTitle className="text-3xl font-medium tabular-nums">{stats.usersByRole}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">System access tiers</CardContent>
        </Card>
      </div>

      <Card className="rounded-none overflow-hidden border shadow-none">
        <CardHeader>
          <CardTitle>Users by Role</CardTitle>
          <CardDescription>Distribution of permissions</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-6">
          <div className="flex items-center justify-center gap-1">
            <div className="flex flex-col gap-1.5 pr-2">
              {usersByRoleData.map((entry) => (
                <div key={entry.role} className="flex items-center gap-2">
                  <div className="size-2 rounded-full" style={{ backgroundColor: entry.fill }} />
                  <span className="text-xs text-muted-foreground min-w-[70px]">{entry.role}</span>
                  <span className="text-xs font-medium tabular-nums">{entry.count}</span>
                </div>
              ))}
            </div>
            <ChartContainer config={usersChartConfig} className="h-[320px] w-[320px] shrink-0">
              <PieChart width={320} height={320}>
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Pie 
                  data={usersByRoleData} 
                  dataKey="count" 
                  nameKey="role" 
                  cx="50%"
                  cy="50%"
                  innerRadius={70} 
                  outerRadius={140} 
                  paddingAngle={2}
                  stroke="none"
                >
                  {usersByRoleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
