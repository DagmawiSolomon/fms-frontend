"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react"

// --- Mock Data ---
const stats = {
  pendingBudgetApprovals: 3,
  pendingCashRequests: 12,
  totalPendingAmount: 45000,
  remainingBudget: 120000,
  trends: {
    budgets: "+1",
    requests: "+4",
    amount: "+$8,500",
    remaining: "-$2,100"
  }
}

const approvalPipelineData = [
  { status: "Approved", count: 85, fill: "#10b981" },
  { status: "Pending", count: 15, fill: "#f59e0b" },
  { status: "Rejected", count: 5, fill: "#ef4444" },
]

const approvalChartConfig = {
  approved: { label: "Approved", color: "#10b981" },
  pending: { label: "Pending", color: "#f59e0b" },
  rejected: { label: "Rejected", color: "#ef4444" },
} satisfies ChartConfig

const budgetUtilizationData = [
  { type: "Used", amount: 280000, fill: "#3b82f6" },
  { type: "Remaining", amount: 120000, fill: "#10b981" },
]

const utilizationChartConfig = {
  used: { label: "Used", color: "#3b82f6" },
  remaining: { label: "Remaining", color: "#10b981" },
} satisfies ChartConfig

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value)
}

export function ManagerDashboardView() {
  return (
    <div className="flex flex-col gap-0">
      <div className="grid gap-0 md:grid-cols-4 border border-b-0 rounded-none overflow-hidden">
        <Card className="rounded-none border-0 shadow-none @container/card">
          <CardHeader className="pb-2">
            <CardDescription>Pending Budgets</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{stats.pendingBudgetApprovals}</CardTitle>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[10px] text-rose-500 flex items-center">
                <ArrowUpIcon className="size-3" /> {stats.trends.budgets}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase">since yesterday</span>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Awaiting your approval</CardContent>
        </Card>
        <Card className="rounded-none border-b-0 border-r-0 border-t-0 shadow-none @container/card border-l border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>Pending Requests</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{stats.pendingCashRequests}</CardTitle>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[10px] text-rose-500 flex items-center">
                <ArrowUpIcon className="size-3" /> {stats.trends.requests}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase">new today</span>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Cash requests awaiting review</CardContent>
        </Card>
        <Card className="rounded-none border-b-0 border-r-0 border-t-0 shadow-none @container/card border-l border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>Total Pending Amount</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{formatMoney(stats.totalPendingAmount)}</CardTitle>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[10px] text-emerald-500 flex items-center">
                <ArrowUpIcon className="size-3" /> {stats.trends.amount}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase">total volume</span>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Sum of pending items</CardContent>
        </Card>
        <Card className="rounded-none border-b-0 border-r-0 border-t-0 shadow-none @container/card border-l border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>Remaining Budget</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{formatMoney(stats.remainingBudget)}</CardTitle>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[10px] text-rose-500 flex items-center">
                <ArrowDownIcon className="size-3" /> {stats.trends.remaining}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase">vs last month</span>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Across your departments</CardContent>
        </Card>
      </div>

      <div className="grid gap-0 lg:grid-cols-2 border rounded-b-[4px] overflow-hidden">
        <Card className="rounded-none border-0 shadow-none">
          <CardHeader>
            <CardTitle>Approval Pipeline</CardTitle>
            <CardDescription>Request processing status</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={approvalChartConfig} className="h-[300px] w-full">
              <BarChart data={approvalPipelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="status" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Legend verticalAlign="bottom" height={36} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={40}>
                  {approvalPipelineData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="rounded-none border-b-0 border-r-0 border-t-0 shadow-none border-l border-border/50">
          <CardHeader>
            <CardTitle>Budget Utilization</CardTitle>
            <CardDescription>Used vs Remaining funds</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={utilizationChartConfig} className="h-[300px] w-full">
              <PieChart>
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Legend verticalAlign="top" height={36} />
                <Pie data={budgetUtilizationData} dataKey="amount" nameKey="type" cx="50%" cy="45%" innerRadius={60} outerRadius={80} paddingAngle={2}>
                  {budgetUtilizationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
