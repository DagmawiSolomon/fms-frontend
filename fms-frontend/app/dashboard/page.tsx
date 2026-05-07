"use client"

import * as React from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { EmployeeDashboardView } from "@/components/employee-dashboard-view"
import { ManagerDashboardView } from "@/components/manager-dashboard-view"
import { FinanceDashboardView } from "@/components/finance-dashboard-view"
import { AdminDashboardView } from "@/components/admin-dashboard-view"
import { useSession } from "@/hooks/use-session"
import { useRole } from "@/components/role-provider"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning,"
  if (hour < 18) return "Good afternoon,"
  return "Good evening,"
}

export default function DashboardPage() {
  const session = useSession()
  const { role } = useRole()

  const userName = session.data?.name ?? "John"

  return (
    <DashboardShell
      title={`${getGreeting()} ${userName} !`}
      description="Welcome back. Here’s your personalized workspace overview."
    >
      {role === "employee" && <EmployeeDashboardView />}
      {role === "manager" && <ManagerDashboardView />}
      {role === "finance" && <FinanceDashboardView />}
      {role === "admin" && <AdminDashboardView />}
    </DashboardShell>
  )
}
