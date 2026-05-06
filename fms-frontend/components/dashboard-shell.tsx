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
      defaultOpen={false}
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
        />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col">
            <div
              className={cn(
                "flex flex-col gap-0 px-4 pb-4 lg:px-6 md:pb-6",
                "pt-2 group-has-data-[collapsible=icon]/sidebar-wrapper:pt-4",
                "md:pt-2 md:group-has-data-[collapsible=icon]/sidebar-wrapper:md:pt-4"
              )}
            >
              <div className="mb-8 flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                  {description && (
                    <p className="text-muted-foreground max-w-[75ch]">
                      {description}
                    </p>
                  )}
                </div>
                {actions && (
                  <div className="flex items-center gap-3 shrink-0">
                    {actions}
                  </div>
                )}
              </div>
              {children}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
