"use client"

import * as React from "react"
import { Line, LineChart, Pie, PieChart, XAxis, CartesianGrid, Cell, YAxis, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowUp01Icon, ArrowDown01Icon } from "@hugeicons/core-free-icons"
import { fmsApi, normalizeExpenses, normalizeBudgets, filterByPeriod, filterByDepartment, filterByOwnership } from "@/lib/fms"
import { format } from "date-fns"
import { useRole } from "@/components/role-provider"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const spendingChartConfig = {
  amount: { label: "Amount Spent", color: "var(--chart-1)" },
} satisfies ChartConfig

const categoryChartConfig = {
  travel: { label: "Travel", color: "var(--chart-1)" },
  meals: { label: "Meals", color: "var(--chart-2)" },
  supplies: { label: "Supplies", color: "var(--chart-3)" },
  software: { label: "Software", color: "var(--chart-4)" },
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

export function EmployeeDashboardView({ period }: { period: string }) {
  const { user, role } = useRole()
  const [loading, setLoading] = React.useState(true)
  const [data, setData] = React.useState<{
    expenses: any[]
    budgets: any[]
  }>({ expenses: [], budgets: [] })

  React.useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [expensesRes, budgetsRes] = await Promise.all([
          fmsApi.getExpenses(),
          fmsApi.getBudgets()
        ])
        
        let normalizedExpenses = normalizeExpenses(expensesRes)
        let normalizedBudgets = normalizeBudgets(budgetsRes)

        // Employees should only see their own expenses; budget data stays department-scoped.
        normalizedExpenses = filterByOwnership(normalizedExpenses, user)
        normalizedBudgets = filterByDepartment(normalizedBudgets, user, role)

        setData({
          expenses: normalizedExpenses,
          budgets: normalizedBudgets
        })
      } catch (error) {
        console.error("Employee dashboard fetch error:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user, role])

  // Filter budgets by selected period
  const filteredBudgets = React.useMemo(() => {
    return data.budgets.filter(b => b.period === period)
  }, [data.budgets, period])

  // Filter expenses by selected period
  const dateFilteredExpenses = React.useMemo(() => {
    return filterByPeriod(data.expenses, period)
  }, [data.expenses, period]);

  const totalExpensesCount = dateFilteredExpenses.length
  const totalSpent = dateFilteredExpenses
    .filter(e => e.status === "approved" || e.status === "verified")
    .reduce((sum, e) => sum + e.amount, 0)
  
  const totalAllocated = filteredBudgets.reduce((sum, b) => sum + b.amount, 0)
  const remainingFunds = Math.max(totalAllocated - totalSpent, 0)

  // Charts
  const spendingOverTime = React.useMemo(() => {
    const groups: Record<string, number> = {}
    dateFilteredExpenses.forEach(e => {
      if (!e.date) return
      const d = new Date(e.date)
      const label = format(d, "MMM dd")
      groups[label] = (groups[label] || 0) + e.amount
    })
    return Object.entries(groups)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [dateFilteredExpenses])

  const categories = React.useMemo(() => {
    const cats: Record<string, number> = {}
    dateFilteredExpenses.forEach(e => {
      const cat = e.category || "Other"
      cats[cat] = (cats[cat] || 0) + e.amount
    })
    return Object.entries(cats).map(([category, amount], i) => ({
      category,
      amount,
      fill: `var(--chart-${(i % 5) + 1})`
    }))
  }, [dateFilteredExpenses])

  // Dynamic Trend Calculations
  const prevPeriod = getPreviousPeriod(period)
  const prevBudgets = data.budgets.filter(b => b.period === prevPeriod)
  const prevExpenses = filterByPeriod(data.expenses, prevPeriod)

  const prevTotalSpent = prevExpenses
    .filter(e => e.status === "approved" || e.status === "verified")
    .reduce((sum, e) => sum + e.amount, 0)
  const prevExpensesCount = prevExpenses.length

  const calcTrend = (curr: number, prev: number) => {
    if (prev === 0) return { value: "0.0%", isUp: true }
    const val = ((curr - prev) / prev) * 100
    return {
      value: `${val >= 0 ? "+" : ""}${val.toFixed(1)}%`,
      isUp: val >= 0
    }
  }

  const trends = {
    expenses: calcTrend(totalExpensesCount, prevExpensesCount),
    spent: calcTrend(totalSpent, prevTotalSpent)
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
        <div className="grid gap-0 lg:grid-cols-2 border rounded-b-[4px] overflow-hidden">
          <Card className="rounded-none border-0 shadow-none p-6">
            <Skeleton className="h-[300px] w-full" />
          </Card>
          <Card className="rounded-none border-l border-border/50 shadow-none p-6">
            <Skeleton className="h-[300px] w-full" />
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
            <CardDescription>Total Expenses</CardDescription>
            <CardTitle className="text-3xl font-heading tabular-nums text-slate-50">{totalExpensesCount}</CardTitle>
            <div className="flex items-center gap-1 mt-1">
              <span className={cn(
                "text-[10px] flex items-center",
                trends.expenses.isUp ? "text-emerald-500" : "text-rose-500"
              )}>
                <HugeiconsIcon icon={trends.expenses.isUp ? ArrowUp01Icon : ArrowDown01Icon} className="size-3" /> {trends.expenses.value}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase">vs prev period</span>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Expenses submitted to date</CardContent>
        </Card>
        <Card className="rounded-none border-b-0 border-r-0 border-t-0 shadow-none @container/card border-l border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>Total Spent</CardDescription>
            <CardTitle className="text-3xl font-heading tabular-nums text-slate-50">{formatMoney(totalSpent)}</CardTitle>
            <div className="flex items-center gap-1 mt-1">
              <span className={cn(
                "text-[10px] flex items-center",
                trends.spent.isUp ? "text-rose-500" : "text-emerald-500"
              )}>
                <HugeiconsIcon icon={trends.spent.isUp ? ArrowUp01Icon : ArrowDown01Icon} className="size-3" /> {trends.spent.value}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase">vs prev period</span>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Sum of all approved expenses</CardContent>
        </Card>
        <Card className="rounded-none border-b-0 border-r-0 border-t-0 shadow-none @container/card border-l border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>Remaining Funds</CardDescription>
            <CardTitle className="text-3xl font-heading tabular-nums text-slate-50">{formatMoney(remainingFunds)}</CardTitle>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[10px] text-emerald-500 flex items-center font-medium">
                {((remainingFunds / (totalAllocated || 1)) * 100).toFixed(1)}%
              </span>
              <span className="text-[10px] text-muted-foreground uppercase ml-1">of budget remains</span>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Available balance this period</CardContent>
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
              <LineChart data={spendingOverTime} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
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
                {categories.map((entry) => (
                  <div key={entry.category} className="flex items-center gap-2">
                    <div className="size-2 rounded-full" style={{ backgroundColor: entry.fill }} />
                    <span className="text-xs text-muted-foreground min-w-[70px] font-medium uppercase tracking-tight">{entry.category}</span>
                    <span className="text-xs tabular-nums font-semibold">{formatMoney(entry.amount)}</span>
                  </div>
                ))}
              </div>
              <ChartContainer config={categoryChartConfig} className="h-[240px] w-[240px] shrink-0">
                <PieChart width={240} height={240}>
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                  <Pie 
                    data={categories} 
                    dataKey="amount" 
                    nameKey="category" 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={60} 
                    outerRadius={100} 
                    paddingAngle={2}
                    stroke="none"
                  >
                    {categories.map((entry, index) => (
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
