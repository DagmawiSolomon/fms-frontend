"use client"

import { toast } from "sonner"

import { getAuthToken } from "@/lib/auth"

export const API_BASE_URL =
  typeof window !== "undefined"
    ? window.location.origin + "/fms-proxy/"
    : (process.env.NEXT_PUBLIC_FMS_API_BASE_URL ??
      "https://fms-app-production-5b62.up.railway.app")
      .replace(/\/$/, "") + "/"

export class ApiError extends Error {
  status: number
  details: unknown

  constructor(message: string, status: number, details: unknown) {
    super(message)
    this.status = status
    this.details = details
  }
}

type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown
  skipAuth?: boolean
}

function joinPath(path: string) {
  // Local auth-bridge routes should NOT go through the proxy
  if (path.startsWith("/auth-bridge/")) {
    return path
  }

  // If path starts with /, remove it to avoid reset to root if API_BASE_URL has a subpath
  const cleanPath = path.startsWith("/") ? path.slice(1) : path
  return new URL(cleanPath, API_BASE_URL).toString()
}

function extractErrorMessage(payload: unknown, fallback: string) {
  if (!payload) {
    return fallback
  }

  if (typeof payload === "string") {
    return payload
  }

  if (typeof payload === "object") {
    const candidate = payload as Record<string, unknown>
    const message =
      candidate.message ??
      candidate.error ??
      candidate.title ??
      candidate.detail ??
      candidate.msg

    if (typeof message === "string" && message.trim()) {
      return message
    }
  }

  return fallback
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { body, headers, skipAuth, ...requestInit } = options
  const requestHeaders = new Headers(headers)
  requestHeaders.set("Accept", "application/json")

  if (!skipAuth) {
    const token = getAuthToken()
    if (token) {
      requestHeaders.set("Authorization", `Bearer ${token}`)
    }
  }

  let requestBody: BodyInit | undefined
  if (body instanceof FormData) {
    requestBody = body
  } else if (typeof body !== "undefined") {
    requestHeaders.set("Content-Type", "application/json")
    requestBody = JSON.stringify(body)
  }

  console.log(`[API] Fetching: ${joinPath(path)}`)
  const response = await fetch(joinPath(path), {
    ...requestInit,
    mode: "cors",
    body: requestBody,
    headers: requestHeaders,
  })

  const text = await response.text()
  const payload = text ? safeParseJson(text) : null

  if (!response.ok) {
    const message = extractErrorMessage(
      payload,
      `Request failed with status ${response.status}`
    )
    toast.error(message)
    throw new ApiError(message, response.status, payload)
  }

  // Debug: log raw API responses so we can see the envelope shape
  console.log(`[API] Response from ${path}:`, payload)

  return payload as T
}

function safeParseJson(value: string) {
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

export function unwrapList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) {
    return payload as T[]
  }

  if (payload && typeof payload === "object") {
    const candidate = payload as Record<string, unknown>

    // Named keys — ordered from most to least specific
    const knownKeys = [
      "data", "items", "results", "payload",
      "budgets", "expenses", "cash_requests", "cashRequests",
      "users", "list", "records", "rows", "collection",
    ]

    for (const key of knownKeys) {
      const value = candidate[key]
      if (Array.isArray(value)) {
        return value as T[]
      }
    }

    // Last resort: return the first array-valued property found
    for (const value of Object.values(candidate)) {
      if (Array.isArray(value)) {
        return value as T[]
      }
    }
  }

  return []
}
