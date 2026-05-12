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
import { fmsApi, normalizeBudgets, normalizeExpenses, normalizeSummary, filterByPeriod } from "@/lib/fms"
import { Skeleton } from "@/components/ui/skeleton"

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

function getPreviousPeriod(period: string) {
  const [qStr, yearStr] = period.split("-")
  const q = parseInt(qStr.substring(1))
  const year = parseInt(yearStr)
  if (q === 1) return `Q4-${year - 1}`
  return `Q${q - 1}-${year}`
}

export function LeadershipDashboardView({ period }: { period: string }) {
  const [loading, setLoading] = React.useState(true)
  const [data, setData] = React.useState<{
    budgets: any[]
    expenses: any[]
    summary: any | null
  }>({ budgets: [], expenses: [], summary: null })

  const [weeklyLimit, setWeeklyLimit] = React.useState(5000)
  const [isEditingLimit, setIsEditingLimit] = React.useState(false)
  const [hideThresholdAlert, setHideThresholdAlert] = React.useState(false)

  React.useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [budgetsRes, expensesRes, summaryRes] = await Promise.all([
          fmsApi.getBudgets(),
          fmsApi.getExpenses(),
          fmsApi.getBudgetSummary(),
        ])
        setData({
          budgets: normalizeBudgets(budgetsRes),
          expenses: normalizeExpenses(expensesRes),
          summary: normalizeSummary(summaryRes),
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
  
  // High-level metrics for leadership
  const totalBudget = data.summary?.totalBudget ?? filteredBudgets.reduce((sum, b) => sum + b.amount, 0)
  const totalSpent = data.summary?.totalSpent ?? operatingExpenses
  
  // Calculate efficiency: (Total Budget - Total Spent) / Total Budget * 10
  // Higher is better (less waste)
  const efficiencyScore = totalBudget > 0 
    ? Math.max(0, Math.min(10, ((totalBudget - totalSpent) / totalBudget) * 10)).toFixed(1)
    : "0.0"

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

  // Dynamic Trend Calculations
  const prevPeriod = getPreviousPeriod(period)
  const prevBudgets = data.budgets.filter(b => b.period === prevPeriod)
  const prevExpenses = filterByPeriod(data.expenses, prevPeriod)

  const prevTotalBudget = prevBudgets.reduce((sum, b) => sum + b.amount, 0)
  const prevTotalSpent = prevExpenses.reduce((sum, e) => sum + e.amount, 0)

  const budgetTrendVal = prevTotalBudget > 0 ? ((totalBudget - prevTotalBudget) / prevTotalBudget * 100) : 0
  const spentTrendVal = prevTotalSpent > 0 ? ((totalSpent - prevTotalSpent) / prevTotalSpent * 100) : 0
  
  const budgetTrend = {
    value: `${budgetTrendVal >= 0 ? "+" : ""}${budgetTrendVal.toFixed(1)}%`,
    isUp: budgetTrendVal >= 0
  }
  const spentTrend = {
    value: `${spentTrendVal >= 0 ? "+" : ""}${spentTrendVal.toFixed(1)}%`,
    isUp: spentTrendVal >= 0
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-0">
        <div className="grid gap-0 md:grid-cols-3 border border-b-0 rounded-none overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="rounded-none border-b-0 border-r-0 border-t-0 shadow-none @container/card border-l border-border/50 first:border-0">
              <CardHeader className="pb-2 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-3 w-20" />
              </CardHeader>
            </Card>
          ))}
        </div>
        <div className="grid gap-0 lg:grid-cols-1 border rounded-b-[4px] overflow-hidden">
          <Card className="rounded-none border-0 shadow-none p-6">
            <Skeleton className="h-[350px] w-full" />
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-0">
      <div className="grid gap-0 md:grid-cols-3 border border-b-0 rounded-none overflow-hidden">
        <Card className="rounded-none border-0 shadow-none @container/card">
          <CardHeader className="pb-2">
            <CardDescription>Total Budget Allocated</CardDescription>
            <CardTitle className="text-3xl font-heading tabular-nums text-slate-50">{formatMoney(totalBudget)}</CardTitle>
            <div className="flex items-center gap-1 mt-1">
              <span className={cn(
                "text-[10px] flex items-center",
                budgetTrend.isUp ? "text-emerald-500" : "text-rose-500"
              )}>
                <HugeiconsIcon icon={budgetTrend.isUp ? ArrowUp01Icon : ArrowDown01Icon} className="size-3" /> {budgetTrend.value}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase">vs prev period</span>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Aggregate funding for the current fiscal period</CardContent>
        </Card>

        <Card className="rounded-none border-b-0 border-r-0 border-t-0 shadow-none @container/card border-l border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>Operating Expenses</CardDescription>
            <CardTitle className="text-3xl font-heading tabular-nums text-slate-50">{formatMoney(totalSpent)}</CardTitle>
            <div className="flex items-center gap-1 mt-1">
              <span className={cn(
                "text-[10px] flex items-center",
                spentTrend.isUp ? "text-rose-500" : "text-emerald-500"
              )}>
                <HugeiconsIcon icon={spentTrend.isUp ? ArrowUp01Icon : ArrowDown01Icon} className="size-3" /> 
                {spentTrend.value}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase">vs prev period</span>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Consolidated overhead and operational liquidity</CardContent>
        </Card>


        <Card className="rounded-none border-b-0 border-r-0 border-t-0 shadow-none @container/card border-l border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>Efficiency Score</CardDescription>
            <CardTitle className="text-3xl font-heading tabular-nums text-slate-50">{efficiencyScore}</CardTitle>
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
