"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, Legend } from "recharts"

import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

// --- Mock Data ---
const summary = {
  totalBudget: 1500000,
  totalSpent: 425000,
  activeBudgets: 12,
  pendingApprovals: 3,
  remainingBudget: 1075000,
}

const mockPoints = [
  { label: "Jan", budgeted: 100000, spent: 45000 },
  { label: "Feb", budgeted: 250000, spent: 120000 },
  { label: "Mar", budgeted: 400000, spent: 180000 },
  { label: "Apr", budgeted: 550000, spent: 260000 },
  { label: "May", budgeted: 800000, spent: 340000 },
  { label: "Jun", budgeted: 1200000, spent: 390000 },
  { label: "Jul", budgeted: 1500000, spent: 425000 },
]

const chartConfig = {
  budgeted: {
    label: "Budgeted",
    color: "#3b82f6", // blue-500
  },
  spent: {
    label: "Spent",
    color: "#10b981", // emerald-500
  },
} satisfies ChartConfig

export default function ReportsPage() {
  return (
    <DashboardShell
      title="Reports"
      description="Analytics overview across department budgets and spend trends."
    >
      <div className="grid gap-0 md:grid-cols-2 xl:grid-cols-4 border border-b-0 rounded-none overflow-hidden">
        <ReportCard label="Budgeted" value={summary.totalBudget} />
        <ReportCard label="Spent" value={summary.totalSpent} />
        <ReportCard label="Remaining" value={summary.remainingBudget} />
        <ReportCard label="Pending approvals" value={summary.pendingApprovals} />
      </div>

      <Card className="rounded-b-[4px] overflow-hidden border shadow-none">
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <ChartContainer config={chartConfig} className="h-[360px] w-full">
            <AreaChart data={mockPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="reportBudgeted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="reportSpent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Legend verticalAlign="bottom" height={36} />
              <Area
                dataKey="spent"
                type="natural"
                fill="url(#reportSpent)"
                stroke="#10b981"
              />
              <Area
                dataKey="budgeted"
                type="natural"
                fill="url(#reportBudgeted)"
                stroke="#3b82f6"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </DashboardShell>
  )
}

function ReportCard({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <Card className="rounded-none border-b-0 border-r-0 border-t-0 shadow-none @container/card first:border-l-0 border-l border-border/50">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {formatMoney(value)}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Live reporting snapshot
      </CardContent>
    </Card>
  )
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value)
}
