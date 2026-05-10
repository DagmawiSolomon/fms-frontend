"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  Settings02Icon,
  Alert01Icon
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { fmsApi, normalizeBudgets, normalizeExpenses, filterByPeriod } from "@/lib/fms"

// --- Placeholder for data not yet in API ---
const mockRevenue = 2450000
const mockTrends = {
  revenue: "+12.5%",
  expenses: "+4.2%",
  burnRate: "77%",
  efficiency: "+0.2",
}

const budgetChartConfig = {
  allocated: { label: "Allocated", color: "var(--chart-1)" },
  actual: { label: "Actual", color: "var(--chart-2)" },
} satisfies ChartConfig

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value)
}

export function LeadershipDashboardView({ period }: { period: string }) {
  const [loading, setLoading] = React.useState(true)
  const [data, setData] = React.useState<{
    budgets: any[]
    expenses: any[]
  }>({ budgets: [], expenses: [] })

  const [weeklyLimit, setWeeklyLimit] = React.useState(5000)
  const [isEditingLimit, setIsEditingLimit] = React.useState(false)
  const [hideThresholdAlert, setHideThresholdAlert] = React.useState(false)

  React.useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [budgetsRes, expensesRes] = await Promise.all([
          fmsApi.getBudgets(),
          fmsApi.getExpenses(),
        ])
        setData({
          budgets: normalizeBudgets(budgetsRes),
          expenses: normalizeExpenses(expensesRes),
        })
      } catch (error) {
        console.error("Leadership dashboard fetch error:", error)
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

  const filteredExpenses = React.useMemo(() => {
    return filterByPeriod(data.expenses, period)
  }, [data.expenses, period])

  const operatingExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0)

  const budgetOverviewData = React.useMemo(() => {
    const categories: Record<string, { allocated: number, actual: number }> = {}
    filteredBudgets.forEach(b => {
      const cat = b.department || "Other"
      if (!categories[cat]) categories[cat] = { allocated: 0, actual: 0 }
      categories[cat].allocated += b.amount
      categories[cat].actual += b.spent
    })
    return Object.entries(categories).map(([category, vals]) => ({ category, ...vals }))
  }, [filteredBudgets])

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
      <div className="grid gap-0 md:grid-cols-3 border border-b-0 rounded-none overflow-hidden">
        <Card className="rounded-none border-0 shadow-none @container/card">
          <CardHeader className="pb-2">
            <CardDescription>Total Revenue</CardDescription>
            <CardTitle className="text-3xl font-heading tabular-nums text-slate-50">{formatMoney(mockRevenue)}</CardTitle>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[10px] text-emerald-500 flex items-center">
                <HugeiconsIcon icon={ArrowUp01Icon} className="size-3" /> {mockTrends.revenue}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase">vs last qtr</span>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Aggregate gross performance across all revenue centers</CardContent>
        </Card>

        <Card className="rounded-none border-b-0 border-r-0 border-t-0 shadow-none @container/card border-l border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>Operating Expenses</CardDescription>
            <CardTitle className="text-3xl font-heading tabular-nums text-slate-50">{formatMoney(operatingExpenses)}</CardTitle>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[10px] text-rose-500 flex items-center">
                <HugeiconsIcon icon={ArrowUp01Icon} className="size-3" /> {mockTrends.expenses}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase">of total budget</span>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Consolidated overhead and operational liquidity</CardContent>
        </Card>


        <Card className="rounded-none border-b-0 border-r-0 border-t-0 shadow-none @container/card border-l border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>Efficiency Score</CardDescription>
            <CardTitle className="text-3xl font-heading tabular-nums text-slate-50">9.4</CardTitle>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[10px] text-emerald-500 flex items-center">
                <HugeiconsIcon icon={ArrowUp01Icon} className="size-3" /> {mockTrends.efficiency}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase">Index Score</span>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Optimized operational performance index</CardContent>
        </Card>
      </div>

      <div className="grid gap-0 lg:grid-cols-1 border rounded-b-[4px] overflow-hidden">
        <Card className="rounded-none border-0 shadow-none">
          <CardHeader>
            <CardTitle>Budget Allocation vs Actuals</CardTitle>
            <CardDescription>Executive Overview by Category</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={budgetChartConfig} className="h-[350px] w-full">
              <BarChart data={budgetOverviewData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="category" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} tickFormatter={(val) => `$${val / 1000}k`} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Legend verticalAlign="bottom" height={36} />
                <Bar dataKey="allocated" fill="var(--color-allocated)" radius={[0, 0, 0, 0]} barSize={40} />
                <Bar dataKey="actual" fill="var(--color-actual)" radius={[0, 0, 0, 0]} barSize={40} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
