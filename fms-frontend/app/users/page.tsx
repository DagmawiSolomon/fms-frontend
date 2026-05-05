"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
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
import { useSession } from "@/hooks/use-session"
import { clearAuthToken, normalizeRole } from "@/lib/auth"
import { fmsApi } from "@/lib/fms"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

type UserRow = {
  id: string | number
  name: string
  email: string
  role: "admin" | "Finance Team" | "user"
}

export default function UsersPage() {
  const session = useSession()
  const role = normalizeRole(session.data?.role ?? null)
  const router = useRouter()
  const queryClient = useQueryClient()

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: async () => normalizeUsers(await fmsApi.getUsers()),
  })

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: UserRow["id"]; role: UserRow["role"] }) =>
      fmsApi.updateUserRole(id, role),
    onSuccess: async () => {
      toast.success("User role updated")
      await queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })

  const canManage = role === "admin"

  return (
    <DashboardShell
      title="Users"
      description="Administrative user management and role control"
    >
      {!canManage ? (
        <Card className="mx-4 lg:mx-6">
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
        <Card className="mx-4 lg:mx-6">
          <CardHeader>
            <CardTitle>All users</CardTitle>
            <CardDescription>Change roles and review the active account list</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-lg border">
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
                  {usersQuery.isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        Loading users...
                      </TableCell>
                    </TableRow>
                  ) : usersQuery.data?.length ? (
                    usersQuery.data.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.role}</Badge>
                        </TableCell>
                      <TableCell className="text-right">
                          <Select
                            value={user.role}
                            onValueChange={(value) =>
                              roleMutation.mutate({
                                id: user.id,
                                role: value as UserRow["role"],
                              })
                            }
                          >
                            <SelectTrigger className="ml-auto w-40">
                              <SelectValue placeholder="Change role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">admin</SelectItem>
                              <SelectItem value="Finance Team">Finance Team</SelectItem>
                              <SelectItem value="user">user</SelectItem>
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

function normalizeUsers(payload: unknown): UserRow[] {
  const list = Array.isArray(payload)
    ? payload
    : (payload as { data?: unknown[]; items?: unknown[] } | null)?.data ??
      (payload as { data?: unknown[]; items?: unknown[] } | null)?.items ??
      []

  return list.map((item, index) => {
    const user = item as Record<string, unknown>
    return {
      id: normalizeIdentifier(user.id ?? user._id, index),
      name: (user.name ?? user.fullName ?? "User") as string,
      email: (user.email ?? "user@example.com") as string,
      role: normalizeRole(user.role as string | null | undefined),
    }
  })
}

function normalizeIdentifier(
  value: unknown,
  fallback: string | number
): string | number {
  if (typeof value === "string" || typeof value === "number") {
    return value
  }

  return fallback
}
