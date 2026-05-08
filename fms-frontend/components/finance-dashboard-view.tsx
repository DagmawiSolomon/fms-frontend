"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, LineChart, Legend, ResponsiveContainer, LabelList } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowUp01Icon, ArrowDown01Icon } from "@hugeicons/core-free-icons"

// --- Original Mock Data ---
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

const expenseDistributionData = [
  {
    name: "Expenses",
    Travel: 45000,
    Software: 120000,
    Hardware: 85000,
    Office: 25000,
    Events: 65000,
  },
]

const expenseChartConfig = {
  Travel: { label: "Travel", color: "#3b82f6" },
  Software: { label: "Software", color: "#8b5cf6" },
  Hardware: { label: "Hardware", color: "#10b981" },
  Office: { label: "Office", color: "#f59e0b" },
  Events: { label: "Events", color: "#ec4899" },
} satisfies ChartConfig

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value)
}

const renderDistributionLabel = (props: any) => {
  const { x, y, width, height, value, dataKey } = props
  if (width < 45) return null

  return (
    <g>
      <text
        x={x + 8}
        y={y + height / 2 - 4}
        fill="#fff"
        fontSize={13}
        fontWeight="700"
        className="select-none pointer-events-none uppercase tracking-tighter"
      >
        {dataKey}
      </text>
      <text
        x={x + 8}
        y={y + height / 2 + 12}
        fill="#fff"
        fillOpacity={0.8}
        fontSize={11}
        fontWeight="500"
        className="select-none pointer-events-none tabular-nums"
      >
        {formatMoney(value)}
      </text>
    </g>
  )
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
                <HugeiconsIcon icon={ArrowUp01Icon} className="size-3" /> {stats.trends.allocated}
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
                <HugeiconsIcon icon={ArrowUp01Icon} className="size-3" /> {stats.trends.used}
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
                <HugeiconsIcon icon={ArrowDown01Icon} className="size-3" /> {stats.trends.remaining}
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
                <HugeiconsIcon icon={ArrowUp01Icon} className="size-3" /> {stats.trends.requests}
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
                <HugeiconsIcon icon={ArrowDown01Icon} className="size-3" /> {stats.trends.verifications}
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
                <Bar dataKey="used" stackId="a" fill="var(--color-used)" radius={[0, 0, 0, 0]} barSize={30} />
                <Bar dataKey="remaining" stackId="a" fill="var(--color-remaining)" radius={[0, 0, 0, 0]} barSize={30} />
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
            <CardDescription>Global breakdown (Distribution view)</CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-2">
            <div className="flex flex-wrap items-center justify-end gap-4 mb-6">
              {Object.entries(expenseChartConfig).map(([key, config]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className="size-2 rounded-full" style={{ backgroundColor: config.color }} />
                  <span className="text-xs text-muted-foreground whitespace-nowrap uppercase font-medium tracking-tight">{config.label}</span>
                </div>
              ))}
            </div>
            <ChartContainer config={expenseChartConfig} className="h-24 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={expenseDistributionData}
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
                  {Object.keys(expenseChartConfig).map((key) => (
                    <Bar
                      key={key}
                      dataKey={key}
                      stackId="a"
                      fill={`var(--color-${key})`}
                      radius={[0, 0, 0, 0]}
                    >
                      <LabelList dataKey={key} content={renderDistributionLabel} />
                    </Bar>
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
