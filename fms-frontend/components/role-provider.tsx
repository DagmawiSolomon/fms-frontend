"use client"

import * as React from "react"

export type Role = "employee" | "manager" | "finance" | "admin"

interface RoleContextType {
  role: Role
  setRole: (role: Role) => void
}

const RoleContext = React.createContext<RoleContextType | undefined>(undefined)

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = React.useState<Role>("employee")
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
    const savedRole = localStorage.getItem("fms-role") as Role | null
    if (savedRole && ["employee", "manager", "finance", "admin"].includes(savedRole)) {
      setRoleState(savedRole)
    }
  }, [])

  const setRole = React.useCallback((newRole: Role) => {
    setRoleState(newRole)
    localStorage.setItem("fms-role", newRole)
  }, [])

  // To prevent hydration mismatch, you could return null before mount if necessary
  // but just letting it start with 'employee' is usually fine since it's client-side state.

  return (
    <RoleContext.Provider value={{ role, setRole }}>
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
