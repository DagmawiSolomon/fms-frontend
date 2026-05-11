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
  const [periodType, setPeriodType] = React.useState("yearly")
  const [selectedMonth, setSelectedMonth] = React.useState(new Date().getMonth())
  const [selectedQuarter, setSelectedQuarter] = React.useState(Math.floor(new Date().getMonth() / 3) + 1)
  const [selectedYear, setSelectedYear] = React.useState(2026)

  const currentPeriod = React.useMemo(() => {
    return `Q${selectedQuarter}-${selectedYear}`
  }, [selectedQuarter, selectedYear])

  const userName = session.data?.name ?? "John"

  const dashboardActions = (
    <div className="flex items-center gap-2">
      <Select value={selectedQuarter.toString()} onValueChange={(v) => setSelectedQuarter(parseInt(v))}>
        <SelectTrigger className="w-[100px] !h-9 text-sm font-normal rounded-[4px] border border-white/10 bg-white/[0.03]">
          <SelectValue placeholder="Quarter" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Q1</SelectItem>
          <SelectItem value="2">Q2</SelectItem>
          <SelectItem value="3">Q3</SelectItem>
          <SelectItem value="4">Q4</SelectItem>
        </SelectContent>
      </Select>

      <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
        <SelectTrigger className="w-[90px] !h-9 text-sm font-normal rounded-[4px] border border-white/10 bg-white/[0.03]">
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="2024">2024</SelectItem>
          <SelectItem value="2025">2025</SelectItem>
          <SelectItem value="2026">2026</SelectItem>
        </SelectContent>
      </Select>

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
      description={role === "admin" 
        ? "Monitor platform infrastructure, service availability, and user account distribution." 
        : `Viewing performance for ${currentPeriod}.`}
      actions={role !== "admin" ? dashboardActions : undefined}
      hideBreadcrumbs
    >
      {role === "employee" && <EmployeeDashboardView period={currentPeriod} />}
      {role === "manager" && <ManagerDashboardView period={currentPeriod} />}
      {role === "finance" && <FinanceDashboardView period={currentPeriod} />}
      {role === "admin" && <AdminDashboardView />}
      {role === "leadership" && <LeadershipDashboardView period={currentPeriod} />}
    </DashboardShell>
  )
}
