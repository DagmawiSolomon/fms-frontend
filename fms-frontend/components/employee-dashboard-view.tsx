"use client"

import * as React from "react"
import { Line, LineChart, Pie, PieChart, XAxis, CartesianGrid, Tooltip, Cell, YAxis, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

// --- Mock Data ---
const stats = {
  totalExpenses: 28,
  totalSpent: 4250.75,
  remainingFunds: 1749.25,
}

const spendingData = [
  { date: "May 01", amount: 150 },
  { date: "May 02", amount: 300 },
  { date: "May 03", amount: 250 },
  { date: "May 04", amount: 800 },
  { date: "May 05", amount: 450 },
  { date: "May 06", amount: 900 },
]

const spendingChartConfig = {
  amount: { label: "Amount Spent", color: "#3b82f6" },
} satisfies ChartConfig

const categoryData = [
  { category: "Travel", amount: 1800, fill: "#3b82f6" },
  { category: "Meals", amount: 850, fill: "#8b5cf6" },
  { category: "Supplies", amount: 1100, fill: "#10b981" },
  { category: "Software", amount: 500, fill: "#f59e0b" },
]

const categoryChartConfig = {
  travel: { label: "Travel", color: "#3b82f6" },
  meals: { label: "Meals", color: "#8b5cf6" },
  supplies: { label: "Supplies", color: "#10b981" },
  software: { label: "Software", color: "#f59e0b" },
} satisfies ChartConfig

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value)
}

export function EmployeeDashboardView() {
  return (
    <div className="flex flex-col gap-0">
      <div className="grid gap-0 md:grid-cols-3 border border-b-0 rounded-none overflow-hidden">
        <Card className="rounded-none border-0 shadow-none @container/card">
          <CardHeader className="pb-2">
            <CardDescription>Total Expenses</CardDescription>
            <CardTitle className="text-3xl font-medium tabular-nums">{stats.totalExpenses}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Expenses submitted to date</CardContent>
        </Card>
        <Card className="rounded-none border-b-0 border-r-0 border-t-0 shadow-none @container/card border-l border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>Total Spent</CardDescription>
            <CardTitle className="text-3xl font-medium tabular-nums">{formatMoney(stats.totalSpent)}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Sum of all approved expenses</CardContent>
        </Card>
        <Card className="rounded-none border-b-0 border-r-0 border-t-0 shadow-none @container/card border-l border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>Remaining Funds</CardDescription>
            <CardTitle className="text-3xl font-medium tabular-nums">{formatMoney(stats.remainingFunds)}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Available from approved requests</CardContent>
        </Card>
      </div>

      <div className="grid gap-0 lg:grid-cols-2 border rounded-b-[4px] overflow-hidden">
        <Card className="rounded-none border-0 shadow-none">
          <CardHeader>
            <CardTitle>Spending Over Time</CardTitle>
            <CardDescription>Your verified expenditures</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={spendingChartConfig} className="h-[300px] w-full">
              <LineChart data={spendingData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} tickFormatter={(val) => `$${val}`} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Legend verticalAlign="bottom" height={36} />
                <Line type="monotone" dataKey="amount" stroke="var(--color-amount)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="rounded-none border-b-0 border-r-0 border-t-0 shadow-none border-l border-border/50">
          <CardHeader>
            <CardTitle>Expense Categories</CardTitle>
            <CardDescription>Breakdown by category</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-6">
            <div className="flex items-center justify-center gap-1">
              <div className="flex flex-col gap-1.5 pr-2">
                {categoryData.map((entry) => (
                  <div key={entry.category} className="flex items-center gap-2">
                    <div className="size-2 rounded-full" style={{ backgroundColor: entry.fill }} />
                    <span className="text-xs text-muted-foreground min-w-[70px]">{entry.category}</span>
                    <span className="text-xs font-medium tabular-nums">{formatMoney(entry.amount)}</span>
                  </div>
                ))}
              </div>
              <ChartContainer config={categoryChartConfig} className="h-[240px] w-[240px] shrink-0">
                <PieChart width={240} height={240}>
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                  <Pie 
                    data={categoryData} 
                    dataKey="amount" 
                    nameKey="category" 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={60} 
                    outerRadius={100} 
                    paddingAngle={2}
                    stroke="none"
                  >
                    {categoryData.map((entry, index) => (
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
