"use client"

import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { Toaster } from "@/components/ui/sonner"
import { RoleProvider } from "@/components/role-provider"

export function AppProviders({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <RoleProvider>
        {children}
        <Toaster richColors closeButton />
      </RoleProvider>
    </QueryClientProvider>
  )
}
