"use client"

import * as React from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { EmployeeDashboardView } from "@/components/employee-dashboard-view"
import { ManagerDashboardView } from "@/components/manager-dashboard-view"
import { FinanceDashboardView } from "@/components/finance-dashboard-view"
import { AdminDashboardView } from "@/components/admin-dashboard-view"
import { useSession } from "@/hooks/use-session"
import { useRole } from "@/components/role-provider"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Sun, Cloud, CloudRain, CloudLightning } from "lucide-react"
import { format } from "date-fns"
import { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { HugeiconsIcon } from "@hugeicons/react"
import { GoogleDocIcon } from "@hugeicons/core-free-icons"
import { isFinanceLeadershipEmail } from "@/lib/auth"
import { useRouter } from "next/navigation"

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning,"
  if (hour < 18) return "Good afternoon,"
  return "Good evening,"
}

const WEATHER_DATA = [
  { icon: Sun, temp: "28°C", label: "Sunny", color: "text-amber-500" },
  { icon: Cloud, temp: "22°C", label: "Partly Cloudy", color: "text-slate-400" },
  { icon: CloudRain, temp: "18°C", label: "Showers", color: "text-blue-400" },
  { icon: CloudLightning, temp: "20°C", label: "Stormy", color: "text-indigo-400" },
]

function WeatherDisplay() {
  const day = new Date().getDate()
  const weather = WEATHER_DATA[day % WEATHER_DATA.length]
  const Icon = weather.icon
  
  return (
    <div className="flex flex-col gap-1 text-sm text-muted-foreground mt-1">
      <span className="font-heading text-lg text-slate-50">{format(new Date(), "EEEE, MMMM do")}</span>
      <div className="flex items-center gap-1.5 opacity-60">
        <Icon className="size-4" />
        <span className="font-medium text-foreground">{weather.temp}</span>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const session = useSession()
  const { role } = useRole()
  const router = useRouter()
  const isFinanceLeader = isFinanceLeadershipEmail(session.data?.email)
  const [periodType, setPeriodType] = React.useState("yearly")
  const [selectedMonth, setSelectedMonth] = React.useState(new Date().getMonth())
  const [selectedQuarter, setSelectedQuarter] = React.useState(Math.floor(new Date().getMonth() / 3) + 1)
  const [selectedYear, setSelectedYear] = React.useState(2026)

  const currentPeriod = React.useMemo(() => {
    return `Q${selectedQuarter}-${selectedYear}`
  }, [selectedQuarter, selectedYear])

  const userName = session.data?.name ?? "John"

  const exportQuarterlyReport = React.useCallback(() => {
    router.push(`/reports/quarterly?period=${encodeURIComponent(currentPeriod)}`)
  }, [currentPeriod, router])

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

      {(role === "finance" || isFinanceLeader) && (
        <Button
          className="h-9 rounded-[4px] bg-slate-50 hover:bg-slate-50/90 text-black font-medium px-4 flex items-center gap-2"
          onClick={exportQuarterlyReport}
        >
          <HugeiconsIcon icon={GoogleDocIcon} className="size-4" />
          Export PDF
        </Button>
      )}
    </div>
  )

  return (
    <DashboardShell
      title={`${getGreeting()} ${userName} !`}
      description={role === "admin"
        ? "Monitor platform infrastructure, service availability, and user account distribution."
        : <WeatherDisplay />}
      actions={role !== "admin" ? dashboardActions : undefined}
      hideBreadcrumbs
    >
      {role === "employee" && <EmployeeDashboardView period={currentPeriod} />}
      {role === "manager" && <ManagerDashboardView period={currentPeriod} />}
      {role === "finance" && <FinanceDashboardView period={currentPeriod} />}
      {role === "admin" && <AdminDashboardView />}
    </DashboardShell>
  )
}
