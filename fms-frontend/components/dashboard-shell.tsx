"use client"

import * as React from "react"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { cn } from "@/lib/utils"

export function DashboardShell({
  title,
  description,
  actions,
  children,
}: Readonly<{
  title: string
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
}>) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "13rem",
          "--header-height": "45px",
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset>
        <SiteHeader
          title={title}
          description={description}
          actions={actions}
        />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div
              className={cn(
                "flex flex-col gap-4 pb-4 md:gap-6 md:pb-6",
                "pt-2 group-has-data-[collapsible=icon]/sidebar-wrapper:pt-4",
                "md:pt-2 md:group-has-data-[collapsible=icon]/sidebar-wrapper:md:pt-4"
              )}
            >
              {children}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
