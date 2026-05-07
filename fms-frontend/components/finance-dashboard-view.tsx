"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell, Line, LineChart, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"

// --- Mock Data ---
const stats = {
  totalBudgetAllocated: 850000,
  totalBudgetUsed: 540000,
  remainingBudget: 310000,
  pendingCashRequestsCount: 8,
  pendingCashRequestsAmount: 24500,
  pendingExpenseVerifications: 12,
  trends: {
    allocated: "+2.5%",
    used: "+12.1%",
    remaining: "-4.3%",
    requests: "+5",
    verifications: "-2"
  }
}

const budgetByDeptData = [
  { dept: "Engineering", used: 180000, remaining: 120000 },
  { dept: "Marketing", used: 85000, remaining: 65000 },
  { dept: "Sales", used: 120000, remaining: 80000 },
  { dept: "HR", used: 45000, remaining: 55000 },
  { dept: "Operations", used: 20000, remaining: 430000 },
]

const budgetDeptChartConfig = {
  used: { label: "Used", color: "#3b82f6" },
  remaining: { label: "Remaining", color: "#10b981" },
} satisfies ChartConfig

const cashFlowData = [
  { month: "Jan", requested: 45000, disbursed: 40000 },
  { month: "Feb", requested: 52000, disbursed: 50000 },
  { month: "Mar", requested: 38000, disbursed: 38000 },
  { month: "Apr", requested: 65000, disbursed: 60000 },
  { month: "May", requested: 85000, disbursed: 75000 },
]

const cashFlowChartConfig = {
  requested: { label: "Requested", color: "#8b5cf6" },
  disbursed: { label: "Disbursed", color: "#10b981" },
} satisfies ChartConfig

const expenseCategoryData = [
  { category: "Travel", amount: 45000, fill: "#3b82f6" },
  { category: "Software", amount: 120000, fill: "#8b5cf6" },
  { category: "Hardware", amount: 85000, fill: "#10b981" },
  { category: "Office", amount: 25000, fill: "#f59e0b" },
  { category: "Events", amount: 65000, fill: "#ec4899" },
]

const expenseChartConfig = {
  travel: { label: "Travel", color: "#3b82f6" },
  software: { label: "Software", color: "#8b5cf6" },
  hardware: { label: "Hardware", color: "#10b981" },
  office: { label: "Office", color: "#f59e0b" },
  events: { label: "Events", color: "#ec4899" },
} satisfies ChartConfig

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value)
}

export function FinanceDashboardView() {
  return (
    <div className="flex flex-col gap-0">
      <div className="grid gap-0 md:grid-cols-5 border border-b-0 rounded-none overflow-hidden">
        <Card className="rounded-none border-0 shadow-none @container/card">
          <CardHeader className="pb-2">
            <CardDescription>Allocated Budget</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{formatMoney(stats.totalBudgetAllocated)}</CardTitle>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[10px] text-emerald-500 flex items-center">
                <ArrowUpIcon className="size-3" /> {stats.trends.allocated}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase">from last month</span>
            </div>
          </CardHeader>
        </Card>
        <Card className="rounded-none border-b-0 border-r-0 border-t-0 shadow-none @container/card border-l border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>Budget Used</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{formatMoney(stats.totalBudgetUsed)}</CardTitle>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[10px] text-rose-500 flex items-center">
                <ArrowUpIcon className="size-3" /> {stats.trends.used}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase">vs previous</span>
            </div>
          </CardHeader>
        </Card>
        <Card className="rounded-none border-b-0 border-r-0 border-t-0 shadow-none @container/card border-l border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>Remaining</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{formatMoney(stats.remainingBudget)}</CardTitle>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[10px] text-rose-500 flex items-center">
                <ArrowDownIcon className="size-3" /> {stats.trends.remaining}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase">from last month</span>
            </div>
          </CardHeader>
        </Card>
        <Card className="rounded-none border-b-0 border-r-0 border-t-0 shadow-none @container/card border-l border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>Pending Requests</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {stats.pendingCashRequestsCount} <span className="text-sm font-normal text-muted-foreground">({formatMoney(stats.pendingCashRequestsAmount)})</span>
            </CardTitle>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[10px] text-emerald-500 flex items-center">
                <ArrowUpIcon className="size-3" /> {stats.trends.requests}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase">new requests</span>
            </div>
          </CardHeader>
        </Card>
        <Card className="rounded-none border-b-0 border-r-0 border-t-0 shadow-none @container/card border-l border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>Pending Verifications</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{stats.pendingExpenseVerifications}</CardTitle>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[10px] text-emerald-500 flex items-center">
                <ArrowDownIcon className="size-3" /> {stats.trends.verifications}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase">since yesterday</span>
            </div>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-0 lg:grid-cols-2 border rounded-b-[4px] overflow-hidden">
        <Card className="rounded-none border-0 shadow-none">
          <CardHeader>
            <CardTitle>Budget Utilization by Department</CardTitle>
            <CardDescription>Used vs Remaining</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={budgetDeptChartConfig} className="h-[300px] w-full">
              <BarChart data={budgetByDeptData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="dept" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} tickFormatter={(val) => `$${val / 1000}k`} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Legend verticalAlign="bottom" height={36} />
                <Bar dataKey="used" stackId="a" fill="var(--color-used)" radius={[0, 0, 4, 4]} barSize={30} />
                <Bar dataKey="remaining" stackId="a" fill="var(--color-remaining)" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="rounded-none border-b-0 border-r-0 border-t-0 shadow-none border-l border-border/50">
          <CardHeader>
            <CardTitle>Cash Flow Over Time</CardTitle>
            <CardDescription>Requested vs Disbursed amounts</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={cashFlowChartConfig} className="h-[300px] w-full">
              <LineChart data={cashFlowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} tickFormatter={(val) => `$${val / 1000}k`} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Legend verticalAlign="bottom" height={36} />
                <Line type="monotone" dataKey="requested" stroke="var(--color-requested)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="disbursed" stroke="var(--color-disbursed)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 rounded-none border-b-0 border-r-0 border-l-0 shadow-none border-t border-border/50">
          <CardHeader>
            <CardTitle>Expense Categories</CardTitle>
            <CardDescription>Global breakdown</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-6">
            <div className="flex items-center justify-center gap-1">
              <div className="flex flex-col gap-1.5 pr-2">
                {expenseCategoryData.map((entry) => (
                  <div key={entry.category} className="flex items-center gap-2">
                    <div className="size-2 rounded-full" style={{ backgroundColor: entry.fill }} />
                    <span className="text-xs text-muted-foreground min-w-[80px]">{entry.category}</span>
                    <span className="text-xs tabular-nums">{formatMoney(entry.amount)}</span>
                  </div>
                ))}
              </div>
              <ChartContainer config={expenseChartConfig} className="h-[300px] w-[300px] shrink-0">
                <PieChart width={300} height={300}>
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                  <Pie 
                    data={expenseCategoryData} 
                    dataKey="amount" 
                    nameKey="category" 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={70} 
                    outerRadius={110} 
                    paddingAngle={2}
                    stroke="none"
                  >
                    {expenseCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
