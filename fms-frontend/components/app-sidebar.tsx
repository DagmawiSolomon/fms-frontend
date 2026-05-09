"use client"

import * as React from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  LogoutSquare01Icon,
  Moon02Icon,
  Sun03Icon,
  UserIcon,
} from "@hugeicons/core-free-icons"
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
import { clearAuthToken } from "@/lib/auth"
import { useSession } from "@/hooks/use-session"
import { cn } from "@/lib/utils"
import { useRole } from "@/components/role-provider"

import { ALL_NAV_ITEMS, ROLE_CONFIGS } from "@/lib/roles"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const session = useSession()
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const { role, config } = useRole()

  const visibleItems = ALL_NAV_ITEMS.filter((item) =>
    config.navigation.includes(item.title)
  )

  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const themeLabel = mounted ? (resolvedTheme === "dark" ? "Light mode" : "Dark mode") : "Theme"
  const ThemeIcon = mounted ? (resolvedTheme === "dark" ? Sun03Icon : Moon02Icon) : Sun03Icon

  return (
    <Sidebar
      collapsible="icon"
      {...props}
      className={cn(
        "border-r border-sidebar-border/70 bg-sidebar bg-noise",
        props.className
      )}
    >
      <SidebarHeader>
        <div className="flex items-center justify-start px-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <SidebarTrigger className="rounded-[4px] text-sidebar-foreground hover:bg-sidebar-accent/50" />
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
          items={[{ title: "Profile", url: "/profile", icon: UserIcon }]}
        />


      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter>
        <SidebarMenu className="my-3">
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Log out"
              className="gap-3 group-data-[collapsible=icon]:justify-center text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => {
                clearAuthToken()
                router.push("/login")
              }}
            >
              <span className="flex size-4 items-center justify-center shrink-0 rounded-sm [&_svg]:size-4 [&_svg]:shrink-0">
                <HugeiconsIcon icon={LogoutSquare01Icon} />
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
