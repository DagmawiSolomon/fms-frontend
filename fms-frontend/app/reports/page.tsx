"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, LineChart, Legend, ResponsiveContainer, Area, AreaChart } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { DashboardShell } from "@/components/dashboard-shell"
import { cn, formatMoney } from "@/lib/utils"

// --- Aggregated Mock Data ---
const combinedData = [
  { month: "Jan", budgets: 450000, expenses: 380000, pettyCash: 12000 },
  { month: "Feb", budgets: 450000, expenses: 410000, pettyCash: 15000 },
  { month: "Mar", budgets: 500000, expenses: 460000, pettyCash: 18000 },
  { month: "Apr", budgets: 500000, expenses: 420000, pettyCash: 14000 },
  { month: "May", budgets: 550000, expenses: 480000, pettyCash: 20000 },
]

const chartConfig = {
  budgets: { label: "Total Budgets", color: "#6366f1" },
  expenses: { label: "Total Expenses", color: "#10b981" },
  pettyCash: { label: "Petty Cash", color: "#f59e0b" },
} satisfies ChartConfig

export default function ReportsPage() {
  return (
    <DashboardShell
      title="Financial Reports"
      description="Unified analytics and data aggregation across all microservices."
    >
      <div className="flex flex-col gap-6">
        <div className="grid gap-0 md:grid-cols-4 border border-b-0 rounded-none overflow-hidden">
          <ReportStat
            label="Total Allocation"
            value={2450000}
            description="FY2026 Aggregate Budget"
            isFirst
          />
          <ReportStat
            label="Burn Rate"
            value={485000}
            description="Average monthly expenditure"
          />
          <ReportStat
            label="Petty Cash Velocity"
            value={18500}
            description="Average weekly petty cash usage"
          />
          <ReportStat
            label="Efficiency Score"
            value={94}
            unit="%"
            description="Budget utilization vs forecast"
          />
        </div>

        <div className="grid gap-0 lg:grid-cols-2 border rounded-b-[4px] overflow-hidden">
          <Card className="rounded-none border-0 shadow-none">
            <CardHeader>
              <CardTitle>Expenditure Trends</CardTitle>
              <CardDescription>Comparison of budgets vs actual spending</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[350px] w-full">
                <AreaChart data={combinedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBudgets" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-budgets)" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="var(--color-budgets)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-expenses)" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="var(--color-expenses)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} tickFormatter={(val) => `$${val / 1000}k`} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                  <Legend verticalAlign="bottom" height={36} />
                  <Area type="monotone" dataKey="budgets" stroke="var(--color-budgets)" fillOpacity={1} fill="url(#colorBudgets)" strokeWidth={2} />
                  <Area type="monotone" dataKey="expenses" stroke="var(--color-expenses)" fillOpacity={1} fill="url(#colorExpenses)" strokeWidth={2} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="rounded-none border-b-0 border-r-0 border-t-0 shadow-none border-l border-border/50">
            <CardHeader>
              <CardTitle>Petty Cash Utilization</CardTitle>
              <CardDescription>Monthly aggregated petty cash activity</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[350px] w-full">
                <BarChart data={combinedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} tickFormatter={(val) => `$${val / 1000}k`} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                  <Bar dataKey="pettyCash" fill="var(--color-pettyCash)" radius={[0, 0, 0, 0]} barSize={40} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
}

function ReportStat({ label, value, unit = "$", description, isFirst }: { label: string, value: number, unit?: string, description: string, isFirst?: boolean }) {
  return (
    <Card className={cn(
      "rounded-none border-0 shadow-none border-border/50",
      !isFirst && "border-l"
    )}>
      <CardHeader className="pb-2">
        <CardDescription className="text-[10px] uppercase tracking-[0.2em] font-bold">{label}</CardDescription>
        <CardTitle className="text-3xl tabular-nums tracking-tighter">
          {unit === "$" ? formatMoney(value) : `${value}${unit}`}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-[10px] text-muted-foreground italic leading-tight">
        {description}
      </CardContent>
    </Card>
  )
}

