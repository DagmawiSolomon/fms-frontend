"use client"

import * as React from "react"
import { SearchIcon, ShieldAlertIcon } from "lucide-react"
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
import { clearAuthToken } from "@/lib/auth"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useRole } from "@/components/role-provider"

type UserRow = {
  id: string
  name: string
  email: string
  role: "admin" | "finance" | "manager" | "employee"
}

const mockUsers: UserRow[] = [
  { id: "USR-001", name: "System Administrator", email: "admin@fms.inc", role: "admin" },
  { id: "USR-002", name: "Sarah Jenkins", email: "s.jenkins@fms.inc", role: "finance" },
  { id: "USR-003", name: "Marcus Webb", email: "m.webb@fms.inc", role: "manager" },
  { id: "USR-004", name: "Alex Torres", email: "a.torres@fms.inc", role: "employee" },
  { id: "USR-005", name: "Diana Prince", email: "d.prince@fms.inc", role: "manager" },
  { id: "USR-006", name: "Chris Evans", email: "c.evans@fms.inc", role: "employee" },
  { id: "USR-007", name: "Natasha Romanoff", email: "n.romanoff@fms.inc", role: "finance" },
]

export default function UsersPage() {
  const router = useRouter()
  const { role, hasPermission } = useRole()
  
  const [users, setUsers] = React.useState<UserRow[]>(mockUsers)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [roleFilter, setRoleFilter] = React.useState("all")

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const canView = hasPermission("users.view_all")
  const canManage = hasPermission("users.change_role")

  const handleRoleChange = (id: string, newRole: UserRow["role"]) => {
    setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u))
    toast.success("User role updated successfully")
  }

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
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    {canManage && <TableHead className="text-right">Action</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length ? (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{user.role}</Badge>
                        </TableCell>
                        {canManage && (
                          <TableCell className="text-right">
                            <Select
                              value={user.role}
                              onValueChange={(value) => handleRoleChange(user.id, value as UserRow["role"])}
                            >
                              <SelectTrigger className="ml-auto w-40">
                                <SelectValue placeholder="Change role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="finance">Finance</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                                <SelectItem value="employee">Employee</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={canManage ? 4 : 3} className="h-24 text-center">
                        No users found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardShell>
  )
}
