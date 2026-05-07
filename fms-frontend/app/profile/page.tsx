"use client"

import type { ReactNode } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRole } from "@/components/role-provider"
import { useSession } from "@/hooks/use-session"

export default function ProfilePage() {
  const session = useSession()

  const user = {
    name: session.data?.name && session.data.name !== "Unknown User" ? session.data.name : "Alex Torres",
    email: session.data?.email && session.data.email !== "unknown@example.com" ? session.data.email : "a.torres@fms.inc",
    avatar: session.data?.avatar || "https://i.pravatar.cc/150?u=a.torres@fms.inc"
  }

  const { role } = useRole()

  return (
    <DashboardShell
      title="Profile"
      description="View and manage your personal identity, organizational role, and current authentication status."
    >
      <Card className="rounded-none border shadow-none">
        <CardContent className="p-8 space-y-8">
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20 rounded-full border border-border/50">
              <AvatarImage className="rounded-[4px]" src={user.avatar} alt={user.name} />
              <AvatarFallback className="rounded-[4px] text-xl">{initials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div className="text-2xl tracking-tight text-foreground">{user.name}</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
            </div>
          </div>

          <div className="grid gap-x-12 gap-y-8 sm:grid-cols-2 max-w-2xl">
            <Info label="Name" value={user.name} />
            <Info label="Email" value={user.email} />
            <Info label="Role" value={<span className="capitalize">{role}</span>} />
            <Info label="Status" value={
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                <span className="text-sm text-foreground">Active</span>
              </div>
            } />
          </div>

          {session.isLoading ? (
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground/50 pt-4 border-t border-border/50">
              Synchronizing account data...
            </div>
          ) : null}
        </CardContent>
      </Card>
    </DashboardShell>
  )
}

function Info({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50">{label}</div>
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
