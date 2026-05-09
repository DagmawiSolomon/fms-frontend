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

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { HugeiconsIcon } from "@hugeicons/react"
import { GoogleDocIcon } from "@hugeicons/core-free-icons"

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
      <Select value={periodType} onValueChange={setPeriodType}>
        <SelectTrigger className="w-[140px] !h-9 text-sm font-normal rounded-[4px] border border-white/10 bg-white/[0.03]">
          <SelectValue placeholder="Select Period" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="monthly">Monthly</SelectItem>
          <SelectItem value="quarterly">Quarterly</SelectItem>
          <SelectItem value="yearly">Yearly</SelectItem>
        </SelectContent>
      </Select>

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

      {role === "leadership" && (
        <Button
          className="h-9 rounded-[4px] bg-slate-50 hover:bg-slate-50/90 text-black font-medium px-4 flex items-center gap-2"
          onClick={() => toast.info("Audit log exported to email")}
        >
          <HugeiconsIcon icon={GoogleDocIcon} className="size-4" />
          Export
        </Button>
      )}
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
