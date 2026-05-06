"use client"

import * as React from "react"
import { ShieldAlertIcon } from "lucide-react"

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
  const { role } = useRole()
  
  const [users, setUsers] = React.useState<UserRow[]>(mockUsers)
  const canManage = role === "admin"

  const handleRoleChange = (id: string, newRole: UserRow["role"]) => {
    setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u))
    toast.success("User role updated successfully")
  }

  return (
    <DashboardShell
      title="Users"
      description="Administrative user management and role control"
    >
      {!canManage ? (
        <Card className="rounded-none overflow-hidden border shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlertIcon className="size-4" />
              Access limited
            </CardTitle>
            <CardDescription>
              Only administrators can manage the user directory.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => {
                clearAuthToken()
                router.push("/login")
              }}
            >
              Return to login
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-none overflow-hidden border shadow-none">
          <CardHeader>
            <CardTitle>All users</CardTitle>
            <CardDescription>Change roles and review the active account list</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-none border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length ? (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{user.role}</Badge>
                        </TableCell>
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
      )}
    </DashboardShell>
  )
}
