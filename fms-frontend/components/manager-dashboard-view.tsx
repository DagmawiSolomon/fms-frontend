"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowUp01Icon, ArrowDown01Icon } from "@hugeicons/core-free-icons"
import { fmsApi, normalizeBudgets, normalizeCashRequests, normalizeSummary, filterByPeriod } from "@/lib/fms"

// --- Placeholder Trends ---
const trends = {
  budgets: "+1",
  requests: "+4",
  amount: "+$8,500",
  remaining: "-$2,100"
}

const approvalChartConfig = {
  approved: { label: "Approved", color: "var(--chart-2)" },
  pending: { label: "Pending", color: "var(--chart-3)" },
  rejected: { label: "Rejected", color: "var(--chart-4)" },
} satisfies ChartConfig

const utilizationChartConfig = {
  used: { label: "Used", color: "var(--chart-1)" },
  remaining: { label: "Remaining", color: "var(--chart-2)" },
} satisfies ChartConfig

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value)
}

export function ManagerDashboardView({ period }: { period: string }) {
  const [loading, setLoading] = React.useState(true)
  const [data, setData] = React.useState<{
    budgets: any[]
    cashRequests: any[]
    summary: any
    reportPoints: any[]
  }>({ budgets: [], cashRequests: [], summary: null, reportPoints: [] })

  React.useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [budgetsRes, requestsRes, reportRes] = await Promise.all([
          fmsApi.getBudgets(),
          fmsApi.getCashRequests(),
          fmsApi.getReportOverview()
        ])
        
        setData({
          budgets: normalizeBudgets(budgetsRes),
          cashRequests: normalizeCashRequests(requestsRes),
          summary: normalizeSummary(reportRes),
          reportPoints: [] // We'll calculate or use if reportRes has them
        })
      } catch (error) {
        console.error("Manager dashboard fetch error:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Filter by selected period
  const filteredBudgets = React.useMemo(() => {
    return data.budgets.filter(b => b.period === period)
  }, [data.budgets, period])

  // Filter cash requests by selected period
  const filteredRequests = React.useMemo(() => {
    return filterByPeriod(data.cashRequests, period)
  }, [data.cashRequests, period])

  // Calculations
  const pendingBudgets = filteredBudgets.filter(b => b.status === "pending")
  const pendingBudgetApprovals = pendingBudgets.length
  
  const pendingRequests = filteredRequests.filter(r => r.status === "pending")
  const pendingCashRequestsCount = pendingRequests.length
  const totalPendingAmount = pendingRequests.reduce((sum, r) => sum + r.amount, 0)
  
  const totalAllocated = filteredBudgets.reduce((sum, b) => sum + b.amount, 0)
  const totalSpent = filteredBudgets.reduce((sum, b) => sum + b.spent, 0)
  const remainingBudget = Math.max(totalAllocated - totalSpent, 0)

  // Charts
  const approvalPipelineData = React.useMemo(() => {
    const counts = { Approved: 0, Pending: 0, Rejected: 0 }
    filteredRequests.forEach(r => {
      if (r.status === "approved" || r.status === "disbursed") counts.Approved++
      else if (r.status === "pending") counts.Pending++
      else if (r.status === "rejected") counts.Rejected++
    })
    return [
      { status: "Approved", count: counts.Approved, fill: "var(--chart-2)" },
      { status: "Pending", count: counts.Pending, fill: "var(--chart-3)" },
      { status: "Rejected", count: counts.Rejected, fill: "var(--chart-4)" },
    ]
  }, [filteredRequests])

  const budgetUtilizationData = [
    { type: "Used", amount: totalSpent, fill: "var(--chart-1)" },
    { type: "Remaining", amount: remainingBudget, fill: "var(--chart-2)" },
  ]

  if (loading) {
    return (
      <div className="grid gap-0 md:grid-cols-4 border border-b-0 rounded-none overflow-hidden animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-white/5 border-l border-border/50 first:border-0" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-0">
      <div className="grid gap-0 md:grid-cols-4 border border-b-0 rounded-none overflow-hidden">
        <Card className="rounded-none border-0 shadow-none @container/card">
          <CardHeader className="pb-2">
            <CardDescription>Pending Budgets</CardDescription>
            <CardTitle className="text-3xl font-heading tabular-nums text-slate-50">{pendingBudgetApprovals || 0}</CardTitle>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[10px] text-rose-500 flex items-center">
                <HugeiconsIcon icon={ArrowUp01Icon} className="size-3" /> {trends.budgets}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase">since yesterday</span>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Awaiting your approval</CardContent>
        </Card>
        <Card className="rounded-none border-b-0 border-r-0 border-t-0 shadow-none @container/card border-l border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>Pending Requests</CardDescription>
            <CardTitle className="text-3xl font-heading tabular-nums text-slate-50">{pendingCashRequestsCount || 0}</CardTitle>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[10px] text-rose-500 flex items-center">
                <HugeiconsIcon icon={ArrowUp01Icon} className="size-3" /> {trends.requests}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase">new today</span>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Cash requests awaiting review</CardContent>
        </Card>
        <Card className="rounded-none border-b-0 border-r-0 border-t-0 shadow-none @container/card border-l border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>Total Pending Amount</CardDescription>
            <CardTitle className="text-3xl font-heading tabular-nums text-slate-50">{formatMoney(totalPendingAmount)}</CardTitle>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[10px] text-emerald-500 flex items-center">
                <HugeiconsIcon icon={ArrowUp01Icon} className="size-3" /> {trends.amount}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase">total volume</span>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Sum of pending items</CardContent>
        </Card>
        <Card className="rounded-none border-b-0 border-r-0 border-t-0 shadow-none @container/card border-l border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>Remaining Budget</CardDescription>
            <CardTitle className="text-3xl font-heading tabular-nums text-slate-50">{formatMoney(remainingBudget)}</CardTitle>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[10px] text-rose-500 flex items-center">
                <HugeiconsIcon icon={ArrowDown01Icon} className="size-3" /> {trends.remaining}
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
