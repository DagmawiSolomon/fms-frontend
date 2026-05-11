"use client"

import * as React from "react"
import { QueryClient, QueryClientProvider, QueryCache } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

import { Toaster } from "@/components/ui/sonner"
import { RoleProvider } from "@/components/role-provider"
import { clearAuthToken } from "@/lib/auth"

export function AppProviders({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const router = useRouter()
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error: any) => {
            if (error?.status === 401) {
              clearAuthToken()
              router.push("/login")
            }
          },
        }),
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: (failureCount, error: any) => {
              if (error?.status === 401) return false
              return failureCount < 1
            },
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
        <Toaster richColors />
      </RoleProvider>
    </QueryClientProvider>
  )
}
