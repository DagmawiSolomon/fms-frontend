"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, LineChart, Legend, ResponsiveContainer, LabelList } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowUp01Icon, ArrowDown01Icon } from "@hugeicons/core-free-icons"

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
  used: { label: "Used", color: "var(--chart-1)" },
  remaining: { label: "Remaining", color: "var(--chart-2)" },
} satisfies ChartConfig

const cashFlowData = [
  { month: "Jan", requested: 45000, disbursed: 40000 },
  { month: "Feb", requested: 52000, disbursed: 50000 },
  { month: "Mar", requested: 38000, disbursed: 38000 },
  { month: "Apr", requested: 65000, disbursed: 60000 },
  { month: "May", requested: 85000, disbursed: 75000 },
]

const cashFlowChartConfig = {
  requested: { label: "Requested", color: "var(--chart-3)" },
  disbursed: { label: "Disbursed", color: "var(--chart-1)" },
} satisfies ChartConfig

const expenseDistributionData = [
  {
    name: "Expenses",
    Travel: 45000,
    Software: 120000,
    Hardware: 85000,
    Office: 25000,
    Events: 65000,
  },
]

const expenseChartConfig = {
  Travel: { label: "Travel", color: "var(--chart-1)" },
  Software: { label: "Software", color: "var(--chart-2)" },
  Hardware: { label: "Hardware", color: "var(--chart-3)" },
  Office: { label: "Office", color: "var(--chart-4)" },
  Events: { label: "Events", color: "var(--chart-5)" },
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

const renderDistributionLabel = (props: any) => {
  const { x, y, width, height, value, dataKey } = props
  if (width < 45) return null

  return (
    <g>
      <text
        x={x + 8}
        y={y + height / 2 - 4}
        fill="#fff"
        fontSize={13}
        fontWeight="700"
        className="select-none pointer-events-none uppercase tracking-tighter"
      >
        {dataKey}
      </text>
      <text
        x={x + 8}
        y={y + height / 2 + 12}
        fill="#fff"
        fillOpacity={0.8}
        fontSize={11}
        fontWeight="500"
        className="select-none pointer-events-none tabular-nums"
      >
        {formatMoney(value)}
      </text>
    </g>
  )
}

import { fmsApi, normalizeBudgets, normalizeCashRequests, normalizeExpenses, filterByPeriod, filterByDepartment } from "@/lib/fms"
import { useRole } from "@/components/role-provider"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export function FinanceDashboardView({ period }: { period: string }) {
  const { user, role } = useRole()
  const [loading, setLoading] = React.useState(true)
  const [data, setData] = React.useState<{
    budgets: any[]
    cashRequests: any[]
    expenses: any[]
  }>({ budgets: [], cashRequests: [], expenses: [] })

  React.useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [budgetsRes, requestsRes, expensesRes] = await Promise.all([
          fmsApi.getBudgets(),
          fmsApi.getCashRequests(),
          fmsApi.getExpenses()
        ])
        
        let normalizedBudgets = normalizeBudgets(budgetsRes)
        let normalizedRequests = normalizeCashRequests(requestsRes)
        let normalizedExpenses = normalizeExpenses(expensesRes)

        // Enforce department isolation
        normalizedBudgets = filterByDepartment(normalizedBudgets, user, role)
        normalizedRequests = filterByDepartment(normalizedRequests, user, role)
        normalizedExpenses = filterByDepartment(normalizedExpenses, user, role)

        setData({
          budgets: normalizedBudgets,
          cashRequests: normalizedRequests,
          expenses: normalizedExpenses
        })
      } catch (error) {
        console.error("Dashboard fetch error:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user, role])

  // Filter by selected period
  const filteredBudgets = React.useMemo(() => {
    return data.budgets.filter(b => b.period === period)
  }, [data.budgets, period])

  const filteredRequests = React.useMemo(() => {
    return filterByPeriod(data.cashRequests, period)
  }, [data.cashRequests, period])

  const filteredExpenses = React.useMemo(() => {
    return filterByPeriod(data.expenses, period)
  }, [data.expenses, period])

  // Calculations
  const totalBudgetAllocated = filteredBudgets.reduce((sum, b) => sum + b.amount, 0)
  const totalBudgetUsed = filteredBudgets.reduce((sum, b) => sum + b.spent, 0)
  const remainingBudget = Math.max(totalBudgetAllocated - totalBudgetUsed, 0)

  const pendingCashRequests = filteredRequests.filter(r => r.status === "pending")
  const pendingCashRequestsCount = pendingCashRequests.length
  const pendingCashRequestsAmount = pendingCashRequests.reduce((sum, r) => sum + r.amount, 0)

  const pendingVerifications = filteredExpenses.filter(e => e.status === "pending").length

  // Charts
  const budgetByDept = React.useMemo(() => {
    const depts: Record<string, { used: number, remaining: number }> = {}
    filteredBudgets.forEach(b => {
      const dept = b.department || "Other"
      if (!depts[dept]) depts[dept] = { used: 0, remaining: 0 }
      depts[dept].used += b.spent
      depts[dept].remaining += Math.max(b.amount - b.spent, 0)
    })
    return Object.entries(depts).map(([dept, vals]) => ({ dept, ...vals }))
  }, [filteredBudgets])

  const categories = React.useMemo(() => {
    const cats: Record<string, number> = {}
    filteredExpenses.forEach(e => {
      const cat = e.category || "Other"
      cats[cat] = (cats[cat] || 0) + e.amount
    })
    return cats
  }, [filteredExpenses])

  // Dynamic Trend Calculations
  const prevPeriod = getPreviousPeriod(period)
  const prevBudgets = data.budgets.filter(b => b.period === prevPeriod)
  const prevExpenses = filterByPeriod(data.expenses, prevPeriod)
  const prevRequests = filterByPeriod(data.cashRequests, prevPeriod)

  const prevTotalBudget = prevBudgets.reduce((sum, b) => sum + b.amount, 0)
  const prevTotalUsed = prevBudgets.reduce((sum, b) => sum + b.spent, 0)
  const prevTotalRequests = prevRequests.reduce((sum, r) => sum + r.amount, 0)

  const calcTrend = (curr: number, prev: number) => {
    if (prev === 0) return { value: "0.0%", isUp: true }
    const val = ((curr - prev) / prev) * 100
    return {
      value: `${val >= 0 ? "+" : ""}${val.toFixed(1)}%`,
      isUp: val >= 0
    }
  }

  const trends = {
    allocated: calcTrend(totalBudgetAllocated, prevTotalBudget),
    used: calcTrend(totalBudgetUsed, prevTotalUsed),
    requests: calcTrend(pendingCashRequestsAmount, prevTotalRequests)
  }

  const expenseDistribution = [
    { name: "Expenses", ...categories }
  ]

  if (loading) {
    return (
      <div className="flex flex-col gap-0">
        <div className="grid gap-0 md:grid-cols-5 border border-b-0 rounded-none overflow-hidden">
          {[...Array(5)].map((_, i) => (
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
      <div className="grid gap-0 md:grid-cols-5 border border-b-0 rounded-none overflow-hidden">
        <Card className="rounded-none border-0 shadow-none @container/card">
          <CardHeader className="pb-2">
            <CardDescription>Allocated Budget</CardDescription>
            <CardTitle className="text-3xl font-heading tabular-nums text-slate-50">{formatMoney(totalBudgetAllocated)}</CardTitle>
            <div className="flex items-center gap-1 mt-1">
              <span className={cn(
                "text-[10px] flex items-center",
                trends.allocated.isUp ? "text-emerald-500" : "text-rose-500"
              )}>
                <HugeiconsIcon icon={trends.allocated.isUp ? ArrowUp01Icon : ArrowDown01Icon} className="size-3" /> {trends.allocated.value}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase">from last period</span>
            </div>
          </CardHeader>
        </Card>
        <Card className="rounded-none border-b-0 border-r-0 border-t-0 shadow-none @container/card border-l border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>Budget Used</CardDescription>
            <CardTitle className="text-3xl font-heading tabular-nums text-slate-50">{formatMoney(totalBudgetUsed)}</CardTitle>
            <div className="flex items-center gap-1 mt-1">
              <span className={cn(
                "text-[10px] flex items-center",
                trends.used.isUp ? "text-rose-500" : "text-emerald-500"
              )}>
                <HugeiconsIcon icon={trends.used.isUp ? ArrowUp01Icon : ArrowDown01Icon} className="size-3" /> {trends.used.value}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase">vs previous</span>
            </div>
          </CardHeader>
        </Card>
        <Card className="rounded-none border-b-0 border-r-0 border-t-0 shadow-none @container/card border-l border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>Remaining</CardDescription>
            <CardTitle className="text-3xl font-heading tabular-nums text-slate-50">{formatMoney(remainingBudget)}</CardTitle>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[10px] text-emerald-500 flex items-center font-medium">
                {((remainingBudget / (totalBudgetAllocated || 1)) * 100).toFixed(1)}%
              </span>
              <span className="text-[10px] text-muted-foreground uppercase ml-1">liquidity remaining</span>
            </div>
          </CardHeader>
        </Card>
        <Card className="rounded-none border-b-0 border-r-0 border-t-0 shadow-none @container/card border-l border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>Pending Requests</CardDescription>
            <CardTitle className="text-3xl font-heading tabular-nums text-slate-50">
              {pendingCashRequestsCount} <span className="text-sm font-normal text-muted-foreground">({formatMoney(pendingCashRequestsAmount)})</span>
            </CardTitle>
            <div className="flex items-center gap-1 mt-1">
              <span className={cn(
                "text-[10px] flex items-center",
                trends.requests.isUp ? "text-emerald-500" : "text-rose-500"
              )}>
                <HugeiconsIcon icon={trends.requests.isUp ? ArrowUp01Icon : ArrowDown01Icon} className="size-3" /> {trends.requests.value}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase">vs prev period</span>
            </div>
          </CardHeader>
        </Card>
        <Card className="rounded-none border-b-0 border-r-0 border-t-0 shadow-none @container/card border-l border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>Pending Review</CardDescription>
            <CardTitle className="text-3xl font-heading tabular-nums text-slate-50">{pendingVerifications}</CardTitle>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[10px] text-amber-500 flex items-center font-medium">
                ACTION REQUIRED
              </span>
              <span className="text-[10px] text-muted-foreground uppercase ml-1">on {pendingVerifications} items</span>
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
              <BarChart data={budgetByDept} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
            <CardDescription>Global breakdown (Distribution view)</CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-2">
            <div className="flex flex-wrap items-center justify-end gap-4 mb-6">
              {Object.entries(expenseChartConfig).map(([key, config]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className="size-2 rounded-full" style={{ backgroundColor: config.color }} />
                  <span className="text-xs text-muted-foreground whitespace-nowrap uppercase font-medium tracking-tight">{config.label}</span>
                </div>
              ))}
            </div>
            <ChartContainer config={expenseChartConfig} className="h-24 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={expenseDistribution}
                  layout="vertical"
                  margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                >
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" hide />
                  <ChartTooltip
                    cursor={false}
                    shared={false}
                    content={<ChartTooltipContent indicator="dot" hideLabel />}
                  />
                  {Object.keys(expenseChartConfig).map((key) => (
                    <Bar
                      key={key}
                      dataKey={key}
                      stackId="a"
                      fill={`var(--color-${key})`}
                      radius={[0, 0, 0, 0]}
                    >
                      <LabelList dataKey={key} content={renderDistributionLabel} />
                    </Bar>
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
