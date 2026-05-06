"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { useQuery } from "@tanstack/react-query"
import { RefreshCcwIcon } from "lucide-react"

import { DashboardShell } from "@/components/dashboard-shell"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { useSession } from "@/hooks/use-session"
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

export default function DashboardPage() {
  const session = useSession()
  const summaryQuery = useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: async () => normalizeSummary(await fmsApi.getBudgetSummary()),
  })
  const overviewQuery = useQuery({
    queryKey: ["dashboard", "overview"],
    queryFn: async () => normalizeReportPoints(await fmsApi.getReportOverview()),
  })

  const points = overviewQuery.data ?? []
  const summary = summaryQuery.data ?? {
    totalBudget: 0,
    totalSpent: 0,
    activeBudgets: 0,
    pendingApprovals: 0,
    remainingBudget: 0,
  }

  return (
    <DashboardShell
      title="Dashboard"


    >
      <div className="mb-6">
        <div className="flex flex-col gap-1">

          <h2 className="text-2xl tracking-tight">
            {getGreeting()} {session.data?.name ?? "John"}
          </h2>
        </div>
      </div>

      <div className="grid gap-0 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total budget",
            value: summary.totalBudget,
            helper: "Total allocated funds",
          },
          {
            label: "Spent",
            value: summary.totalSpent,
            helper: "Total expenditures",
          },
          {
            label: "Remaining",
            value: summary.remainingBudget,
            helper: "Available funds",
          },
          {
            label: "Pending approvals",
            value: summary.pendingApprovals,
            helper: "Requests awaiting review",
          },
        ].map((item) => (
          <Card key={item.label} className="@container/card">
            <CardHeader>
              <CardDescription>{item.label}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {summaryQuery.isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  formatMoney(item.value)
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {item.helper}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-0 xl:grid-cols-[1.4fr_0.6fr]">
        <Card className="@container/card">
          <CardHeader>
            <CardTitle>Budget utilization</CardTitle>
            <CardDescription>Comparison of allocated versus actual spending</CardDescription>
          </CardHeader>
          <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
            <ChartContainer config={chartConfig} className="h-[320px] w-full">
              <AreaChart data={points}>
                <defs>
                  <linearGradient id="fillBudgeted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-budgeted)" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="var(--color-budgeted)" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="fillSpent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-spent)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-spent)" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Area
                  dataKey="spent"
                  type="natural"
                  fill="url(#fillSpent)"
                  stroke="var(--color-spent)"
                  stackId="a"
                />
                <Area
                  dataKey="budgeted"
                  type="natural"
                  fill="url(#fillBudgeted)"
                  stroke="var(--color-budgeted)"
                  stackId="b"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription>Current account standing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Metric label="Active budgets" value={summary.activeBudgets} />
            <Metric label="Pending approvals" value={summary.pendingApprovals} />
            <Metric label="Remaining budget" value={summary.remainingBudget} money />
          </CardContent>
        </Card>
      </div>
    </DashboardShell >
  )
}

function Metric({
  label,
  value,
  money,
}: {
  label: string
  value: number
  money?: boolean
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-semibold">
        {money ? formatMoney(value) : value.toLocaleString()}
      </div>
    </div>
  )
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value)
}

function getGreeting() {
  const hour = new Date().getHours()

  if (hour < 12) {
    return "Good morning, "
  }

  if (hour < 18) {
    return "Good afternoon, "
  }

  return "Good evening, "
}
