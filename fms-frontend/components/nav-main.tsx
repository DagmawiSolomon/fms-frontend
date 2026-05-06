"use client"

import Link from "next/link"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"

export function NavMain({
  items,
  label = "Navigation",
}: {
  items: {
    title: string
    url: string
    icon?: ReactNode
    isVisible?: boolean
  }[]
  label?: string
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="justify-start px-2 mb-2">{label}</SidebarGroupLabel>
      <SidebarGroupContent className="flex flex-col">
        <SidebarMenu className="gap-2">
          {items
            .filter((item) => item.isVisible !== false)
            .map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={pathname === item.url}
                  className="gap-3 group-data-[collapsible=icon]:justify-center"
                >
                  <Link href={item.url} className={cn("flex w-full items-center gap-3 group-data-[collapsible=icon]:justify-center")}>
                    <span className="flex size-4 items-center justify-center shrink-0 [&_svg]:size-4 [&_svg]:shrink-0">
                      {item.icon}
                    </span>
                    <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
