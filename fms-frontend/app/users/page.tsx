"use client"

import * as React from "react"
import { SearchIcon, ShieldAlertIcon, ArrowUpRight, UserIcon, MailIcon, ShieldCheckIcon, CalendarIcon, BriefcaseIcon } from "lucide-react"
import { Input } from "@/components/ui/input"

import { DashboardShell } from "@/components/dashboard-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useRole } from "@/components/role-provider"
import { cn } from "@/lib/utils"

import { fmsApi, normalizeUsers, type FmsSessionUser } from "@/lib/fms"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"

const ROLE_RANKS: Record<string, number> = {
  admin: 0,
  leadership: 1,
  finance: 2,
  manager: 2,
  employee: 3,
}

export default function UsersPage() {
  const router = useRouter()
  const { role: currentUserRole, config, hasPermission } = useRole()

  React.useEffect(() => {
    if (!config.navigation.includes("Users")) {
      router.push("/dashboard")
    }
  }, [config, router])

  const [users, setUsers] = React.useState<FmsSessionUser[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [roleFilter, setRoleFilter] = React.useState("all")
  const [selectedUser, setSelectedUser] = React.useState<FmsSessionUser | null>(null)

  // Local state for the sidebar
  const [draftRole, setDraftRole] = React.useState<string | null>(null)
  const [draftStatus, setDraftStatus] = React.useState<"active" | "inactive">("active")
  const [saving, setSaving] = React.useState(false)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fmsApi.getUsers()
      setUsers(normalizeUsers(data))
    } catch (err: any) {
      console.error("Failed to fetch users:", err)
      setError(err.message || "Failed to connect to the server. Please check your connection.")
      toast.error("Connection error. Is the backend running?")
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchUsers()
  }, [])

  const filteredUsers = users.filter(user => {
    // Role hierarchy check: Admins see all, others only see their rank and below
    if (currentUserRole !== "admin") {
      const currentRank = ROLE_RANKS[currentUserRole] ?? 99
      const userRank = ROLE_RANKS[user.role] ?? 99
      
      // If the target user has a higher rank (lower number), hide them
      if (userRank < currentRank) return false
    }

    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const canView = hasPermission("users.view_all")
  const canManage = hasPermission("users.change_role")

  const handleSaveChanges = async () => {
    if (!selectedUser || !draftRole) return

    try {
      setSaving(true)
      
      const backendRole = draftRole === "manager" ? "finance" : draftRole
      let newEmail = selectedUser.email

      // Handle Manager Email Flagging
      if (draftRole === "manager" && !newEmail.includes("+manager@")) {
        const [local, domain] = newEmail.split("@")
        newEmail = `${local}+manager@${domain}`
      } else if (draftRole !== "manager" && newEmail.includes("+manager@")) {
        newEmail = newEmail.replace("+manager", "")
      }

      const updates: Promise<any>[] = [
        fmsApi.changeUserRole(selectedUser.id, backendRole)
      ]

      if (currentUserRole === "admin") {
        updates.push(fmsApi.updateUserStatus(selectedUser.id, draftStatus))
      }

      if (newEmail !== selectedUser.email) {
        updates.push(fmsApi.updateUser(selectedUser.id, { email: newEmail }))
      }

      await Promise.all(updates)
      
      toast.success(draftRole === "manager" ? "User promoted to Manager (Finance role + Email flag)" : "User updated successfully")
      fetchUsers()
      setSelectedUser(null)
    } catch (error) {
      console.error("Failed to update user:", error)
      toast.error("Failed to save changes")
    } finally {
      setSaving(false)
    }
  }

  // When a new user is selected, reset draft states
  React.useEffect(() => {
    if (selectedUser) {
      setDraftRole(selectedUser.role)
      setDraftStatus(selectedUser.status || "active")
    }
  }, [selectedUser])

  return (
    <DashboardShell
      title="Users"
      description="Administrative control over user access, permissions, and organizational roles."
    >
      {!canView ? (
        <Card className="rounded-b-[4px] overflow-hidden border shadow-none">
          <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlertIcon className="size-4" />
              Access limited
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              You do not have permission to view the user directory.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                router.push("/dashboard")
              }}
            >
              Return to dashboard
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="rounded-b-[4px] overflow-hidden border shadow-none">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-2.5 top-1.5 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Search name or email..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="All Roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      {Object.keys(ROLE_RANKS)
                        .filter(r => currentUserRole === "admin" || ROLE_RANKS[r] >= (ROLE_RANKS[currentUserRole] ?? 99))
                        .map(r => (
                          <SelectItem key={r} value={r} className="capitalize">
                            {r === "finance" ? "Finance Team" : r}
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="overflow-hidden rounded-none">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs text-muted-foreground/50">User</TableHead>
                      <TableHead className="text-xs text-muted-foreground/50">Email</TableHead>
                      <TableHead className="text-xs text-muted-foreground/50">Role</TableHead>
                      <TableHead className="text-xs text-muted-foreground/50">Status</TableHead>
                      <TableHead className="text-right text-xs text-muted-foreground/50"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : error ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-rose-500">
                          <div className="flex flex-col items-center gap-2">
                            <ShieldAlertIcon className="size-8 opacity-50" />
                            <p>{error}</p>
                            <Button variant="outline" size="sm" onClick={fetchUsers} className="mt-2">
                              Retry Connection
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredUsers.length ? (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="">
                            {user.name}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell className="capitalize">{user.role}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn(
                              "rounded-[4px] capitalize",
                              user.status === "active" ? "border-emerald-500/20 text-emerald-500 bg-emerald-500/5" : "border-slate-500/20 text-slate-500 bg-slate-500/5"
                            )}>
                              {user.status || "active"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedUser(user)}
                            >
                              <ArrowUpRight className="size-4" />
                              <span className="sr-only">View Details</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          No users found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Sheet open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
            <SheetContent className="flex flex-col gap-0 p-0">
              {selectedUser && (
                <>
                  <SheetHeader className="p-6 border-b border-border/50">
                    <SheetTitle>User Management</SheetTitle>
                    <SheetDescription>
                      Administrative control over platform access and permissions.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="flex-1 overflow-y-auto">
                    <div className="grid gap-6 p-6">
                      <div className="flex items-center gap-4 py-2">
                        <Avatar className="h-12 w-12 rounded-full grayscale border border-border/50">
                          <AvatarFallback className="rounded-full">{initials(selectedUser.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-base font-medium text-foreground">{selectedUser.name}</span>
                          <span className="text-xs text-muted-foreground">{selectedUser.email}</span>
                        </div>
                      </div>

                      <Separator className="bg-border/50" />

                      <div className="grid gap-6">
                        <div className="grid gap-2">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">System Role</div>
                          <Select
                            value={draftRole || ""}
                            onValueChange={setDraftRole}
                            disabled={!canManage}
                          >
                            <SelectTrigger className="w-full h-11 bg-white/[0.02] border-white/10 rounded-[4px]">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.keys(ROLE_RANKS)
                                .filter(r => currentUserRole === "admin" || ROLE_RANKS[r] >= (ROLE_RANKS[currentUserRole] ?? 99))
                                .map(r => (
                                  <SelectItem key={r} value={r} className="capitalize">
                                    {r === "finance" ? "Finance Team" : r}
                                  </SelectItem>
                                ))
                              }
                            </SelectContent>
                          </Select>
                          {draftRole === "manager" && (
                            <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-[4px]">
                              <p className="text-[10px] text-amber-500 leading-tight">
                                <span className="font-bold uppercase tracking-wider block mb-1">Manager Note:</span>
                                This user will be assigned the <strong>Finance Team</strong> role on the backend, 
                                with an email flag <strong>(+manager)</strong> to enable the Manager UI.
                              </p>
                            </div>
                          )}
                        </div>

                        {currentUserRole === "admin" && (
                          <div className="grid gap-2">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-rose-500">Danger Zone</div>
                            <div className="flex items-center justify-between py-2 px-3 bg-rose-500/[0.02] border border-rose-500/10 rounded-[4px]">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-medium text-foreground">Account Status</span>
                                <span className="text-[10px] text-muted-foreground">
                                  {draftStatus === "active" ? "Access granted to platform" : "Access currently suspended"}
                                </span>
                              </div>
                              <Switch 
                                checked={draftStatus === "active"}
                                onCheckedChange={(checked) => setDraftStatus(checked ? "active" : "inactive")}
                                disabled={!canManage}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="p-6 border-t border-border/50 bg-white/[0.01]">
                    <div className="flex gap-3">
                      <Button 
                        variant="outline" 
                        className="flex-1 rounded-[4px] h-10" 
                        onClick={() => setSelectedUser(null)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        className="flex-1 rounded-[4px] h-10 bg-slate-50 text-black hover:bg-slate-50/90" 
                        onClick={handleSaveChanges}
                        disabled={saving || !canManage}
                      >
                        {saving ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </SheetContent>
          </Sheet>
        </>
      )}
    </DashboardShell>
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
