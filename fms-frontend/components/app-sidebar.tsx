"use client"

import * as React from "react"
import Link from "next/link"
import {
  ChartColumnBigIcon,
  Gauge,
  HandCoins,
  LogOutIcon,
  ReceiptTextIcon,
  MoonIcon,
  User,
  WalletIcon,
  SunIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"

import { NavMain } from "@/components/nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { clearAuthToken, normalizeRole } from "@/lib/auth"
import { useSession } from "@/hooks/use-session"
import { cn } from "@/lib/utils"

const navItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: <Gauge />,
  },
  {
    title: "Budgets",
    url: "/budgets",
    icon: <HandCoins />,
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
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const session = useSession()
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const role = normalizeRole(session.data?.role ?? null)

  const visibleItems = navItems.filter(
    (item) => item.title !== "Users" || role === "admin"
  )

  const themeLabel = resolvedTheme === "dark" ? "Light mode" : "Dark mode"
  const ThemeIcon = resolvedTheme === "dark" ? SunIcon : MoonIcon

  return (
    <Sidebar
      collapsible="icon"
      {...props}
      className={cn(
        "border-r border-sidebar-border/70 bg-sidebar",
        props.className
      )}
    >
      <SidebarHeader>
        <div className="flex items-center justify-start px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <SidebarTrigger className="rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/50" />
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent >
        <NavMain
          label="Workspace"
          items={visibleItems}
        />

        <SidebarSeparator />
        <NavMain
          label="Settings"
          items={[{ title: "Profile", url: "/profile", icon: <User /> }]}
        />


      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter>
        <SidebarMenu className="gap-2">
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={themeLabel}
              className="gap-3 group-data-[collapsible=icon]:justify-center"
              onClick={() => {
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }}
            >
              <span className="flex size-4 items-center justify-center shrink-0 [&_svg]:size-4 [&_svg]:shrink-0">
                <ThemeIcon />
              </span>
              <span className="group-data-[collapsible=icon]:hidden">{themeLabel}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Log out"
              className="gap-3 group-data-[collapsible=icon]:justify-center"
              onClick={() => {
                clearAuthToken()
                router.push("/login")
              }}
            >
              <span className="flex size-4 items-center justify-center shrink-0 [&_svg]:size-4 [&_svg]:shrink-0">
                <LogOutIcon />
              </span>
              <span className="group-data-[collapsible=icon]:hidden">Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
