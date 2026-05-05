"use client"

import * as React from "react"
import Link from "next/link"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  LayoutDashboardIcon,
  LandmarkIcon,
  ReceiptTextIcon,
  WalletIcon,
  ChartColumnBigIcon,
  UsersIcon,
  UserCircleIcon,
  CommandIcon,
} from "lucide-react"

import { useSession } from "@/hooks/use-session"
import { normalizeRole } from "@/lib/auth"

const navItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: <LayoutDashboardIcon />,
  },
  {
    title: "Budgets",
    url: "/budgets",
    icon: <LandmarkIcon />,
  },
  {
    title: "Cash Requests",
    url: "/cash-requests",
    icon: <ReceiptTextIcon />,
  },
  {
    title: "Expenses",
    url: "/expenses",
    icon: <WalletIcon />,
  },
  {
    title: "Reports",
    url: "/reports",
    icon: <ChartColumnBigIcon />,
  },
  {
    title: "Users",
    url: "/users",
    icon: <UsersIcon />,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const session = useSession()
  const role = normalizeRole(session.data?.role ?? null)
  const user = session.data ?? {
    name: "FMS Team",
    email: "finance@example.com",
    avatar: null,
    role,
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link href="/dashboard">

                <span className="text-base font-semibold">FMS</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          label="Workspace"
          items={navItems.map((item) => ({
            ...item,
            isVisible: item.title !== "Users" || role === "admin",
          }))}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
