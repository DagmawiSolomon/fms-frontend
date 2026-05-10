export const AUTH_TOKEN_COOKIE = "fms_token"
export const AUTH_USER_COOKIE = "fms_user_role"

const AUTH_TOKEN_STORAGE_KEY = "fms_auth_token"

export function getAuthToken() {
  if (typeof window === "undefined") {
    return null
  }

  const storedToken = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
  if (storedToken) {
    return storedToken
  }

  const tokenFromCookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${AUTH_TOKEN_COOKIE}=`))
    ?.split("=")[1]

  return tokenFromCookie ? decodeURIComponent(tokenFromCookie) : null
}

export function setAuthToken(token: string) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token)
  document.cookie = `${AUTH_TOKEN_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${
    60 * 60 * 24 * 7
  }; samesite=lax`
}

export function clearAuthToken() {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
  document.cookie = `${AUTH_TOKEN_COOKIE}=; path=/; max-age=0`
}

import type { Role } from "./roles"

export type UserRole = Role

export function normalizeRole(role?: string | null): UserRole {
  const value = (role ?? "").toLowerCase().trim()

  if (value.includes("admin")) {
    return "admin"
  }

  if (value.includes("finance")) {
    return "finance"
  }

  if (value.includes("manager")) {
    return "manager"
  }

  if (value.includes("leadership") || value.includes("ceo") || value.includes("coo")) {
    return "leadership"
  }

  return "employee"
}
