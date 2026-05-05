"use client"

import { useQuery } from "@tanstack/react-query"

import { fmsApi, normalizeSessionUser } from "@/lib/fms"

export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: async () => normalizeSessionUser(await fmsApi.getMe()),
    staleTime: 5 * 60 * 1000,
  })
}
