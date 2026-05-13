"use client"

import type { ReactNode } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useRole } from "@/components/role-provider"
import { useSession } from "@/hooks/use-session"
import { Skeleton } from "@/components/ui/skeleton"

export default function ProfilePage() {
  const { data: session, isLoading } = useSession()
  const { role } = useRole()

  return (
    <DashboardShell
      title="Profile"
      description="View and manage your personal identity, organizational role, and current authentication status."
    >
      <Card className="rounded-none border shadow-none">
        <CardContent className="p-8 space-y-8">
          {isLoading ? (
            <div className="space-y-8">
              <div className="flex items-center gap-6">
                <Skeleton className="h-20 w-20 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-56" />
                </div>
              </div>
              <div className="grid gap-x-12 gap-y-6 sm:grid-cols-2 max-w-2xl">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20 rounded-full grayscale border border-border/50">
                  <AvatarFallback className="rounded-full text-xl">
                    {initials(session?.name ?? "?")}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <div className="text-2xl tracking-tight text-foreground">
                    {session?.name ?? "—"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {session?.email ?? "—"}
                  </div>
                </div>
              </div>

              <div className="grid gap-x-12 gap-y-8 sm:grid-cols-2 max-w-2xl">
                <Info label="Name" value={session?.name ?? "—"} />
                <Info label="Email" value={session?.email ?? "—"} />
                <Info
                  label="Role"
                  value={<span className="capitalize">{role}</span>}
                />
                <Info
                  label="Department"
                  value={session?.department ?? <span className="text-muted-foreground/50">Not set</span>}
                />
                <Info
                  label="Status"
                  value={
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                      <span className="text-sm text-foreground">Active</span>
                    </div>
                  }
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  )
}

function Info({ label, value, labelClassName }: { label: string; value: ReactNode; labelClassName?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className={`text-xs font-heading text-muted-foreground/50 ${labelClassName || ""}`}>{label}</div>
      <div className="text-sm text-foreground">{value}</div>
    </div>
  )
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}
