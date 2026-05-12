"use client"

import * as React from "react"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { cn } from "@/lib/utils"

export function DashboardShell({
  title,
  description,
  actions,
  children,
  breadcrumbs,
  hideBreadcrumbs,
}: Readonly<{
  title: string
  description?: React.ReactNode
  actions?: React.ReactNode
  children: React.ReactNode
  breadcrumbs?: { label: string; href?: string }[]
  hideBreadcrumbs?: boolean
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
              <div className="flex flex-col gap-0">
                {!hideBreadcrumbs && (
                  <div className="mb-4">
                    <Breadcrumb>
                    <BreadcrumbList>
                      <BreadcrumbItem>
                        <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                      {breadcrumbs ? (
                        breadcrumbs.map((crumb, i) => (
                          <React.Fragment key={i}>
                            <BreadcrumbItem>
                              {crumb.href ? (
                                <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                              ) : (
                                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                              )}
                            </BreadcrumbItem>
                            {i < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                          </React.Fragment>
                        ))
                      ) : (
                        <BreadcrumbItem>
                          <BreadcrumbPage>{title}</BreadcrumbPage>
                        </BreadcrumbItem>
                      )}
                    </BreadcrumbList>
                  </Breadcrumb>
                </div>
                )}
                <div className="flex flex-row items-center justify-between gap-4 border border-b-0 border-white/8 bg-card shadow-[0_1px_0_rgba(255,255,255,0.03)] px-4 py-8 rounded-t-[4px]">
                  <div className="flex flex-col gap-1">
                    <h1 className="text-3xl tracking-tight font-medium font-heading text-slate-50">{title}</h1>
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
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
