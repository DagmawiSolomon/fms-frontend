"use client"

import * as React from "react"

import { Role, ROLE_CONFIGS, RoleConfig } from "@/lib/roles"

interface RoleContextType {
  role: Role
  config: RoleConfig
  setRole: (role: Role) => void
  hasPermission: (permission: string) => boolean
}

const RoleContext = React.createContext<RoleContextType | undefined>(undefined)

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = React.useState<Role>("employee")
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
    const savedRole = localStorage.getItem("fms-role") as Role | null
    if (savedRole && Object.keys(ROLE_CONFIGS).includes(savedRole)) {
      setRoleState(savedRole)
    }
  }, [])

  const setRole = React.useCallback((newRole: Role) => {
    setRoleState(newRole)
    localStorage.setItem("fms-role", newRole)
  }, [])

  const hasPermission = React.useCallback((permission: string) => {
    return ROLE_CONFIGS[role].permissions.includes(permission)
  }, [role])

  const config = ROLE_CONFIGS[role]

  return (
    <RoleContext.Provider value={{ role, config, setRole, hasPermission }}>
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
