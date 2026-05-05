"use client"

import type { ReactNode } from "react"
import { UserRoundIcon } from "lucide-react"

import { DashboardShell } from "@/components/dashboard-shell"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useSession } from "@/hooks/use-session"
import { normalizeRole } from "@/lib/auth"

export default function ProfilePage() {
  const session = useSession()
  const user = session.data
  const role = normalizeRole(user?.role ?? null)

  return (
    <DashboardShell title="Profile" description="Your current authenticated account">
      <Card className="mx-4 lg:mx-6 max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserRoundIcon className="size-4" />
            Account profile
          </CardTitle>
          <CardDescription>Your current account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={user?.avatar ?? ""} alt={user?.name ?? "User"} />
              <AvatarFallback>{initials(user?.name ?? "User")}</AvatarFallback>
            </Avatar>
            <div>
              <div className="text-lg font-semibold">{user?.name ?? "User"}</div>
              <div className="text-sm text-muted-foreground">
                {user?.email ?? "user@example.com"}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Info label="Role" value={<Badge variant="outline">{role}</Badge>} />
            <Info label="Account status" value="Active" />
          </div>

          {session.isLoading ? (
            <div className="text-sm text-muted-foreground">Loading profile...</div>
          ) : null}
        </CardContent>
      </Card>
    </DashboardShell>
  )
}

function Info({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium">{value}</div>
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
