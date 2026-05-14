"use client"

import * as React from "react"
import { useSession } from "@/hooks/use-session"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowDown01Icon,
  UserCircleIcon,
  LogoutSquare01Icon
} from "@hugeicons/core-free-icons"
import { clearAuthToken } from "@/lib/auth"
import { useRouter } from "next/navigation"
import type { ReactNode } from "react"
import { useRole } from "@/components/role-provider"

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

function formatHeaderDate(date: Date) {
  return DATE_FORMATTER.format(date)
}

export function SiteHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: ReactNode
  actions?: ReactNode
}) {
  const session = useSession()
  const router = useRouter()
  const user = session.data ?? {
    name: "FMS Team",
    email: "finance@example.com",
    avatar: null,
  }

  const { role } = useRole()

  return (
    <header className="flex h-(--header-height) shrink-0 items-center border-b border-sidebar-border/70 bg-sidebar text-sidebar-foreground transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-3 px-4">

        <div className="flex min-w-0 items-center gap-2">

          <span className="text-sm flex items-center gap-1 font-medium text-white">

          </span>
          <span className="sr-only">
            {title}
            {description}
          </span>
        </div>

        <div className="ml-auto flex min-w-0 items-center gap-2">
          {actions}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-10 gap-2 rounded-[4px] px-2.5 text-sidebar-foreground hover:bg-sidebar-accent/20"
            >
              <Avatar className="size-7 rounded-full">
                <AvatarFallback className="rounded-full" seed={user.email} name={user.name} />
              </Avatar>
              <span className="hidden max-w-32 truncate text-sm sm:block">
                {user.name}
              </span>
              <HugeiconsIcon icon={ArrowDown01Icon} className="size-4 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 rounded-none bg-sidebar"
            align="end"
            sideOffset={8}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 p-2">
                <Avatar className="size-8 rounded-full">
                  <AvatarFallback className="rounded-full" seed={user.email} name={user.name} />
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm">{user.name}</p>
                  <p className="truncate text-xs text-sidebar-foreground/55">
                    {user.email}
                  </p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/profile")}>
              <HugeiconsIcon icon={UserCircleIcon} />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              onClick={async () => {
                await fetch("/auth-bridge/logout", { method: "POST" })
                clearAuthToken()
                router.push("/login")
              }}
            >
              <HugeiconsIcon icon={LogoutSquare01Icon} />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
