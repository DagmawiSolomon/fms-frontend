"use client"

import * as React from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { EmployeeDashboardView } from "@/components/employee-dashboard-view"
import { ManagerDashboardView } from "@/components/manager-dashboard-view"
import { FinanceDashboardView } from "@/components/finance-dashboard-view"
import { AdminDashboardView } from "@/components/admin-dashboard-view"
import { LeadershipDashboardView } from "@/components/leadership-dashboard-view"
import { useSession } from "@/hooks/use-session"
import { useRole } from "@/components/role-provider"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning,"
  if (hour < 18) return "Good afternoon,"
  return "Good evening,"
}

export default function DashboardPage() {
  const session = useSession()
  const { role } = useRole()
  const [periodType, setPeriodType] = React.useState("monthly")
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(2026, 0, 1),
    to: new Date(2026, 11, 31),
  })

  const userName = session.data?.name ?? "John"

  const dashboardActions = (
    <div className="flex items-center gap-2">
      <Tabs value={periodType} onValueChange={setPeriodType} className="w-auto">
        <TabsList className="h-9 rounded-[4px] bg-background border p-0">
          <TabsTrigger value="monthly" className="rounded-[2px] px-4 h-full text-xs data-[state=active]:bg-white data-[state=active]:text-black">Monthly</TabsTrigger>
          <TabsTrigger value="quarterly" className="rounded-[2px] px-4 h-full text-xs data-[state=active]:bg-white data-[state=active]:text-black">Quarterly</TabsTrigger>
          <TabsTrigger value="yearly" className="rounded-[2px] px-4 h-full text-xs data-[state=active]:bg-white data-[state=active]:text-black">Yearly</TabsTrigger>
        </TabsList>
      </Tabs>
      
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "h-9 w-[240px] justify-start text-left font-normal rounded-[4px] border",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 rounded-none" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )

  return (
    <DashboardShell
      title={`${getGreeting()} ${userName} !`}
      description="Welcome back. Here’s your personalized workspace overview."
      actions={role !== "admin" ? dashboardActions : undefined}
    >
      {role === "employee" && <EmployeeDashboardView />}
      {role === "manager" && <ManagerDashboardView />}
      {role === "finance" && <FinanceDashboardView />}
      {role === "admin" && <AdminDashboardView />}
      {role === "leadership" && <LeadershipDashboardView />}
    </DashboardShell>
  )
}
