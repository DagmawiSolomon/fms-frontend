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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useRole } from "@/components/role-provider"
import { cn } from "@/lib/utils"

type UserRow = {
  id: string
  name: string
  email: string
  role: "admin" | "finance" | "manager" | "employee"
  joinedDate: string
  status: "active" | "inactive"
}

const mockUsers: UserRow[] = [
  { id: "USR-001", name: "System Administrator", email: "admin@fms.inc", role: "admin", joinedDate: "Jan 2024", status: "active" },
  { id: "USR-002", name: "Sarah Jenkins", email: "s.jenkins@fms.inc", role: "finance", joinedDate: "Feb 2024", status: "active" },
  { id: "USR-003", name: "Marcus Webb", email: "m.webb@fms.inc", role: "manager", joinedDate: "Mar 2024", status: "active" },
  { id: "USR-004", name: "Alex Torres", email: "a.torres@fms.inc", role: "employee", joinedDate: "Apr 2024", status: "active" },
  { id: "USR-005", name: "Diana Prince", email: "d.prince@fms.inc", role: "manager", joinedDate: "May 2024", status: "active" },
  { id: "USR-006", name: "Chris Evans", email: "c.evans@fms.inc", role: "employee", joinedDate: "Jun 2024", status: "inactive" },
  { id: "USR-007", name: "Natasha Romanoff", email: "n.romanoff@fms.inc", role: "finance", joinedDate: "Jul 2024", status: "active" },
]

export default function UsersPage() {
  const router = useRouter()
  const { role: currentUserRole, hasPermission } = useRole()

  const [users, setUsers] = React.useState<UserRow[]>(mockUsers)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [roleFilter, setRoleFilter] = React.useState("all")
  const [selectedUser, setSelectedUser] = React.useState<UserRow | null>(null)

  // Local state for the dropdown in the sidebar
  const [draftRole, setDraftRole] = React.useState<UserRow["role"] | null>(null)

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const canView = hasPermission("users.view_all")
  const canManage = hasPermission("users.change_role")

  const handlePromote = () => {
    if (selectedUser && draftRole) {
      const updatedUsers = users.map(u => u.id === selectedUser.id ? { ...u, role: draftRole } : u)
      setUsers(updatedUsers)
      setSelectedUser({ ...selectedUser, role: draftRole })
      toast.success("User role updated")
    }
  }

  // When a new user is selected, reset draft role
  React.useEffect(() => {
    if (selectedUser) {
      setDraftRole(selectedUser.role)
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
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="employee">Employee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="overflow-hidden rounded-none">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground/50">User</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground/50">Email</TableHead>
                      <TableHead className="text-[10px] uppercase tracking-widest text-muted-foreground/50">Role</TableHead>
                      <TableHead className="text-right text-[10px] uppercase tracking-widest text-muted-foreground/50"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length ? (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="">
                            {user.name}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell className="capitalize">{user.role}</TableCell>
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
                        <TableCell colSpan={4} className="h-24 text-center">
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
            <SheetContent>
              {selectedUser && (
                <>
                  <SheetHeader>
                    <SheetTitle>User Info</SheetTitle>
                    <SheetDescription>
                      View and manage user role and status.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="grid gap-6 px-4 pb-4">
                    <div className="flex items-center gap-4 py-2 border-b border-border/50">
                      <Avatar className="h-12 w-12 rounded-full border border-border/50">
                        <AvatarImage src={`https://i.pravatar.cc/150?u=${selectedUser.email}`} alt={selectedUser.name} />
                        <AvatarFallback className="rounded-full">{initials(selectedUser.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-base text-foreground">{selectedUser.name}</span>
                        <span className="text-xs text-muted-foreground">{selectedUser.id}</span>
                      </div>
                    </div>

                    <div className="grid gap-4">
                      <div className="grid gap-1">
                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground/50">Email Address</div>
                        <div className="text-sm text-foreground">{selectedUser.email}</div>
                      </div>

                      <div className="grid gap-2">
                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground/50">Current Role</div>
                        <Select
                          value={draftRole || ""}
                          onValueChange={(value) => setDraftRole(value as UserRow["role"])}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="employee">Employee</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="finance">Finance</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground/50">Account Actions</div>
                        <Button variant="outline" className="w-fit justify-start rounded-[4px]" onClick={handlePromote}>
                          Promote
                        </Button>
                      </div>
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
