"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, LineChart, Legend, Treemap, ResponsiveContainer, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"

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

const expenseTreemapData = [
  { name: "Travel", value: 45000, fill: "#3b82f6" },
  { name: "Software", value: 120000, fill: "#8b5cf6" },
  { name: "Hardware", value: 85000, fill: "#10b981" },
  { name: "Office", value: 25000, fill: "#f59e0b" },
  { name: "Events", value: 65000, fill: "#ec4899" },
]

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value)
}

const CustomTreemapContent = (props: any) => {
  const { x, y, width, height, index, name, value, fill } = props;

  // Calculate dynamic font sizes based on box size
  const nameSize = Math.max(10, Math.min(width / 8, 16));
  const valueSize = Math.max(8, Math.min(width / 10, 14));

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: fill,
          stroke: '#fff',
          strokeWidth: 2 / (index + 1),
          strokeOpacity: 1,
        }}
      />
      {width > 40 && height > 30 && (
        <>
          <text
            x={x + width / 2}
            y={y + height / 2 - 5}
            textAnchor="middle"
            fill="#fff"
            fontSize={nameSize}
            fontWeight="400"
          >
            {name}
          </text>
          <text
            x={x + width / 2}
            y={y + height / 2 + 12}
            textAnchor="middle"
            fill="#fff"
            fontSize={valueSize}
            fontWeight="400"
            opacity={0.8}
          >
            {formatMoney(value)}
          </text>
        </>
      )}
    </g>
  );
};

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
            <CardDescription>Global breakdown (Treemap view)</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <Treemap
                data={expenseTreemapData}
                dataKey="value"
                aspectRatio={4 / 3}
                stroke="#fff"
                content={<CustomTreemapContent />}
              >
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-none border bg-background p-2 shadow-sm text-xs">
                          <div className="font-medium">{payload[0].payload.name}</div>
                          <div className="text-muted-foreground">{formatMoney(payload[0].value)}</div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
              </Treemap>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
