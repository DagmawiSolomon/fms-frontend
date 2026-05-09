"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, LineChart, Legend, ResponsiveContainer, LabelList } from "recharts"
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

// --- Executive Mock Data ---
const executiveStats = {
  totalRevenue: 2450000,
  operatingExpenses: 540000,
  pettyCashLimit: 5000,
  pettyCashSpent: 3850,
  efficiencyScore: 9.4,
  trends: {
    revenue: "+12.5%",
    expenses: "+4.2%",
    burnRate: "77%",
    efficiency: "+0.2",
  },
}

const budgetOverviewData = [
  { category: "Payroll", allocated: 1200000, actual: 1180000 },
  { category: "Marketing", allocated: 350000, actual: 320000 },
  { category: "R&D", allocated: 500000, actual: 480000 },
  { category: "Operations", allocated: 400000, actual: 410000 },
]

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

export function LeadershipDashboardView() {
  const [weeklyLimit, setWeeklyLimit] = React.useState(executiveStats.pettyCashLimit)
  const [isEditingLimit, setIsEditingLimit] = React.useState(false)
  const [hideThresholdAlert, setHideThresholdAlert] = React.useState(false)

  const handleUpdateLimit = () => {
    if (weeklyLimit < executiveStats.pettyCashSpent) {
      toast.warning(`Warning: New limit (${formatMoney(weeklyLimit)}) is lower than current spending.`)
    } else {
      toast.success(`Petty Cash weekly limit updated to ${formatMoney(weeklyLimit)}`)
    }
    setIsEditingLimit(false)
  }

  const pettyCashUsagePercent = (executiveStats.pettyCashSpent / weeklyLimit) * 100
  const isThresholdReached = pettyCashUsagePercent >= 80

  return (
    <div className="flex flex-col gap-0">
      {isThresholdReached && !hideThresholdAlert && (
        <div className="mt-0">
          <Alert className="border-none bg-chart-4/10 text-chart-4 flex items-center justify-start gap-3 [&>svg+div]:translate-y-0 rounded-none">
            <HugeiconsIcon icon={Alert01Icon} className="mt-0.5 size-4" />
            <div className="flex-col justify-center">
              <AlertTitle>Threshold Alert (80%)</AlertTitle>
              <AlertDescription className="text-chart-4/80">
                Weekly petty cash usage has reached {pettyCashUsagePercent.toFixed(1)}%. Monitor expenditures closely.
              </AlertDescription>
            </div>
          </Alert>
        </div>
      )}
      <div className="grid gap-0 md:grid-cols-4 border border-b-0 rounded-none overflow-hidden">
        <Card className="rounded-none border-0 shadow-none @container/card">
          <CardHeader className="pb-2">
            <CardDescription>Total Revenue</CardDescription>
            <CardTitle className="text-3xl font-heading tabular-nums text-slate-50">{formatMoney(executiveStats.totalRevenue)}</CardTitle>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[10px] text-emerald-500 flex items-center">
                <HugeiconsIcon icon={ArrowUp01Icon} className="size-3" /> {executiveStats.trends.revenue}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase">vs last qtr</span>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Aggregate gross performance across all revenue centers</CardContent>
        </Card>

        <Card className="rounded-none border-b-0 border-r-0 border-t-0 shadow-none @container/card border-l border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>Operating Expenses</CardDescription>
            <CardTitle className="text-3xl font-heading tabular-nums text-slate-50">{formatMoney(executiveStats.operatingExpenses)}</CardTitle>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[10px] text-rose-500 flex items-center">
                <HugeiconsIcon icon={ArrowUp01Icon} className="size-3" /> {executiveStats.trends.expenses}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase">of total budget</span>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Consolidated overhead and operational liquidity</CardContent>
        </Card>

        <Card className="rounded-none border-b-0 border-r-0 border-t-0 shadow-none @container/card border-l border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>Burn Rate</CardDescription>
            <CardTitle className={cn(
              "text-3xl font-heading tabular-nums",
              isThresholdReached ? "text-chart-4" : "text-foreground"
            )}>
              {pettyCashUsagePercent.toFixed(1)}%
            </CardTitle>
            <div className="flex items-center gap-1 mt-1">
              <span className={cn(
                "text-[10px] flex items-center",
                isThresholdReached ? "text-chart-4" : "text-chart-1"
              )}>
                {isThresholdReached ? "Threshold Alert!" : "Within Limit"}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase">
                <span className="text-slate-50">{formatMoney(executiveStats.pettyCashSpent)}</span> / {formatMoney(weeklyLimit)}
              </span>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Current capital consumption velocity relative to targets</CardContent>
        </Card>

        <Card className="rounded-none border-b-0 border-r-0 border-t-0 shadow-none @container/card border-l border-border/50">
          <CardHeader className="pb-2">
            <CardDescription>Efficiency Score</CardDescription>
            <CardTitle className="text-3xl font-heading tabular-nums text-slate-50">{executiveStats.efficiencyScore}</CardTitle>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[10px] text-emerald-500 flex items-center">
                <HugeiconsIcon icon={ArrowUp01Icon} className="size-3" /> {executiveStats.trends.efficiency}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase">Index Score</span>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Optimized operational performance index</CardContent>
        </Card>
      </div>

      <div className="grid gap-0 lg:grid-cols-3 border rounded-b-[4px] overflow-hidden">
        <Card className="lg:col-span-2 rounded-none border-0 shadow-none">
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

        <Card className="rounded-none border-b-0 border-r-0 border-t-0 shadow-none border-l border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Burn Rate Settings</CardTitle>
                <CardDescription>Manage burn rate thresholds</CardDescription>
              </div>
              <HugeiconsIcon icon={Settings02Icon} className="size-5 text-muted-foreground/50" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div className="space-y-3">
              <label className="text-sm text-muted-foreground block">Weekly Spending Limit</label>
              {isEditingLimit ? (
                <div className="flex flex-col gap-2">
                  <Input
                    type="number"
                    value={weeklyLimit}
                    onChange={(e) => setWeeklyLimit(Number(e.target.value))}
                    className="h-9 rounded-[4px]"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 h-9 rounded-[4px]" onClick={handleUpdateLimit}>Save Changes</Button>
                    <Button size="sm" variant="outline" className="h-9 rounded-[4px]" onClick={() => setIsEditingLimit(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 border border-dashed rounded-[4px] bg-muted/20">
                  <span className="text-xl font-medium tabular-nums text-slate-50">{formatMoney(weeklyLimit)}</span>
                  <Button variant="ghost" size="sm" className="h-8 text-xs underline" onClick={() => setIsEditingLimit(true)}>Edit Limit</Button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground">Consumption Stats</label>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-baseline">
                  <div className="text-xs">
                    <span className="text-muted-foreground">Burn: </span>
                    <span className="text-muted-foreground font-medium text-slate-50">{formatMoney(executiveStats.pettyCashSpent)}</span>
                    <span className={cn(
                      "ml-1.5 text-[10px]",
                      isThresholdReached ? "text-chart-4 font-bold" : "text-muted-foreground/70"
                    )}>
                      ({pettyCashUsagePercent.toFixed(0)}%)
                    </span>
                  </div>
                  <span className="text-xs font-medium text-slate-50">
                    {formatMoney(weeklyLimit)}
                  </span>
                </div>

                <div className="flex justify-between h-7 items-center overflow-hidden">
                  {Array.from({ length: 90 }).map((_, i) => {
                    const step = (i / 90) * 100
                    const isActive = pettyCashUsagePercent >= step

                    return (
                      <div
                        key={i}
                        className={cn(
                          "w-0.5 h-7 transition-all duration-300",
                          isActive
                            ? (isThresholdReached ? "bg-chart-4" : "bg-chart-1")
                            : "bg-muted"
                        )}
                      />
                    )
                  })}
                </div>
              </div>
            </div>
            
            <div className="h-px bg-border/50 w-full my-4" />


          </CardContent>
        </Card>
      </div>
    </div>
  )
}

