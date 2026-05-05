"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { useQuery } from "@tanstack/react-query"

import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { fmsApi, normalizeReportPoints, normalizeSummary } from "@/lib/fms"

const chartConfig = {
  budgeted: {
    label: "Budgeted",
    color: "var(--primary)",
  },
  spent: {
    label: "Spent",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig

export default function ReportsPage() {
  const overviewQuery = useQuery({
    queryKey: ["reports", "overview"],
    queryFn: async () => {
      const [summary, overview] = await Promise.all([
        fmsApi.getBudgetSummary(),
        fmsApi.getReportOverview(),
      ])

      return {
        summary: normalizeSummary(summary),
        points: normalizeReportPoints(overview),
      }
    },
  })

  const summary = overviewQuery.data?.summary ?? {
    totalBudget: 0,
    totalSpent: 0,
    activeBudgets: 0,
    pendingApprovals: 0,
    remainingBudget: 0,
  }

  return (
    <DashboardShell
      title="Reports"
      description="Overview charts and financial reporting snapshots"
    >
      <div className="grid gap-4 px-4 lg:px-6 md:grid-cols-2 xl:grid-cols-4">
        <ReportCard label="Budgeted" value={summary.totalBudget} loading={overviewQuery.isLoading} />
        <ReportCard label="Spent" value={summary.totalSpent} loading={overviewQuery.isLoading} />
        <ReportCard label="Remaining" value={summary.remainingBudget} loading={overviewQuery.isLoading} />
        <ReportCard label="Pending approvals" value={summary.pendingApprovals} loading={overviewQuery.isLoading} />
      </div>

      <Card className="mx-4 lg:mx-6">
          <CardHeader>
            <CardTitle>Budget and spend trend</CardTitle>
            <CardDescription>Analytics across budget and spend trends</CardDescription>
          </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          {overviewQuery.isLoading ? (
            <Skeleton className="h-[320px] w-full" />
          ) : (
            <ChartContainer config={chartConfig} className="h-[320px] w-full">
              <AreaChart data={overviewQuery.data?.points ?? []}>
                <defs>
                  <linearGradient id="reportBudgeted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-budgeted)" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="var(--color-budgeted)" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="reportSpent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-spent)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-spent)" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Area
                  dataKey="spent"
                  type="natural"
                  fill="url(#reportSpent)"
                  stroke="var(--color-spent)"
                />
                <Area
                  dataKey="budgeted"
                  type="natural"
                  fill="url(#reportBudgeted)"
                  stroke="var(--color-budgeted)"
                />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  )
}

function ReportCard({
  label,
  value,
  loading,
}: {
  label: string
  value: number
  loading?: boolean
}) {
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {loading ? <Skeleton className="h-8 w-24" /> : formatMoney(value)}
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
