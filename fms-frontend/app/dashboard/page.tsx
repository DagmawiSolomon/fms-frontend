"use client"

import * as React from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { EmployeeDashboardView } from "@/components/employee-dashboard-view"
import { ManagerDashboardView } from "@/components/manager-dashboard-view"
import { FinanceDashboardView } from "@/components/finance-dashboard-view"
import { AdminDashboardView } from "@/components/admin-dashboard-view"
import { useSession } from "@/hooks/use-session"
import { useRole } from "@/components/role-provider"
import { toast } from "sonner"
import { buildQuarterlyReportHtml } from "@/lib/quarterly-report-export"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Sun, Cloud, CloudRain, CloudLightning, Loader2, Download } from "lucide-react"
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
  const [isExporting, setIsExporting] = React.useState(false)
  const [hasDownloaded, setHasDownloaded] = React.useState(false)

  const currentPeriod = React.useMemo(() => {
    return `Q${selectedQuarter}-${selectedYear}`
  }, [selectedQuarter, selectedYear])

  const userName = session.data?.name ?? "John"

  const exportQuarterlyReport = React.useCallback(async () => {
    try {
      setIsExporting(true)
      const html = await buildQuarterlyReportHtml(currentPeriod, session.data ?? null, role)
      
      // Create a temporary container for the report content
      const container = document.createElement("div")
      container.innerHTML = html
      container.style.position = "fixed"
      container.style.left = "-9999px"
      container.style.top = "0"
      document.body.appendChild(container)
      
      const content = container.querySelector("#report-content")
      if (!content) throw new Error("Report content not found")

      // Dynamically import html2pdf
      const html2pdf = (await import("html2pdf.js")).default

      const opt = {
        margin: 0,
        filename: `Financial_Report_${currentPeriod}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: "mm" as const, format: "a4" as const, orientation: "portrait" as const }
      }

      // Generate and save the PDF
      await html2pdf().from(content as HTMLElement).set(opt).save()
      
      // Clean up
      document.body.removeChild(container)
      setHasDownloaded(true)
      toast.success("Financial report downloaded successfully")
    } catch (err) {
      console.error(err)
      toast.error("Could not generate the quarterly report.")
    } finally {
      setIsExporting(false)
    }
  }, [currentPeriod, role, session.data])

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
          className="h-9 rounded-[4px] bg-slate-50 hover:bg-slate-50/90 text-black font-medium px-4 flex items-center gap-2 min-w-[120px]"
          onClick={exportQuarterlyReport}
          disabled={isExporting}
        >
          <div className="relative size-4">
            {isExporting ? (
              <Loader2 className="absolute inset-0 size-4 animate-spin text-slate-900" />
            ) : hasDownloaded ? (
              <Download className="absolute inset-0 size-4 animate-in zoom-in duration-300" />
            ) : (
              <HugeiconsIcon 
                icon={GoogleDocIcon} 
                className="absolute inset-0 size-4 animate-in fade-in duration-300" 
              />
            )}
          </div>
          <span className={cn(
            "transition-all duration-300",
            isExporting && "animate-pulse"
          )}>
            {isExporting ? "Generating..." : hasDownloaded ? "Download Again" : "Export PDF"}
          </span>
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
