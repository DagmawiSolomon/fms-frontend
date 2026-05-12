"use client"

import * as React from "react"

import { Role, ROLE_CONFIGS, RoleConfig } from "@/lib/roles"
import { useSession } from "@/hooks/use-session"
import { Spinner } from "@/components/ui/spinner"

interface RoleContextType {
  role: Role
  user: any
  config: RoleConfig
  setRole: (role: Role) => void
  hasPermission: (permission: string) => boolean
}

const RoleContext = React.createContext<RoleContextType | undefined>(undefined)

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isLoading } = useSession()
  const [role, setRoleState] = React.useState<Role>("employee")

  React.useEffect(() => {
    if (session?.role) {
      setRoleState(session.role as Role)
    }
  }, [session])

  const setRole = React.useCallback((newRole: Role) => {
    setRoleState(newRole)
  }, [])

  const hasPermission = React.useCallback((permission: string) => {
    return ROLE_CONFIGS[role].permissions.includes(permission)
  }, [role])

  const config = ROLE_CONFIGS[role]

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sidebar">
        <Spinner className="size-8 text-primary" />
      </div>
    )
  }

  return (
    <RoleContext.Provider value={{ role, user: session, config, setRole, hasPermission }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  const context = React.useContext(RoleContext)
  if (context === undefined) {
    throw new Error("useRole must be used within a RoleProvider")
  }
  return context
}
