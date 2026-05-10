import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const FMS_BASE = "https://fms-app-production-5b62.up.railway.app"

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // 1. Auth Protection Logic
  if (!pathname.startsWith("/fms-proxy")) {
    const isAuthPage = pathname === "/login" || pathname === "/register" || pathname === "/forgot-password"
    const token = request.cookies.get("fms_token")?.value

    if (!isAuthPage) {
      // If not logged in and trying to access a protected page
      if (!token) {
        const loginUrl = new URL("/login", request.url)
        return NextResponse.redirect(loginUrl)
      }
      
      // If visiting root, redirect to dashboard
      if (pathname === "/") {
        const dashboardUrl = new URL("/dashboard", request.url)
        return NextResponse.redirect(dashboardUrl)
      }
    } else {
      // If logged in and trying to access an auth page
      if (token) {
        const dashboardUrl = new URL("/dashboard", request.url)
        return NextResponse.redirect(dashboardUrl)
      }
    }

    return NextResponse.next()
  }

  // 2. Proxy Logic for /fms-proxy/*

  // Strip the /fms-proxy prefix to get the upstream path
  const upstreamPath = pathname.replace(/^\/fms-proxy/, "")
  const targetUrl = `${FMS_BASE}${upstreamPath}${search}`

  // Forward headers, dropping host/origin/referer/cookie
  const forwardHeaders = new Headers()
  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase()
    if (
      lower === "host" ||
      lower === "origin" ||
      lower === "referer" ||
      lower === "cookie"
    )
      return
    forwardHeaders.set(key, value)
  })

  const hasBody = request.method !== "GET" && request.method !== "HEAD"
  let body: string | undefined

  if (hasBody) {
    try {
      body = await request.text()
    } catch {
      // no body
    }
  }

  try {
    const upstream = await fetch(targetUrl, {
      method: request.method,
      headers: forwardHeaders,
      body: hasBody && body && body.length > 0 ? body : undefined,
      redirect: "follow", // follow redirects but forward the final response
    })

    const responseHeaders = new Headers()
    upstream.headers.forEach((value, key) => {
      const lower = key.toLowerCase()
      if (
        lower === "transfer-encoding" ||
        lower === "connection" ||
        lower === "keep-alive"
      )
        return
      responseHeaders.set(key, value)
    })

    const responseBody = await upstream.text()
    const contentType = upstream.headers.get("content-type")
    console.log(`[fms-proxy] Upstream response: ${upstream.status} ${contentType} for ${targetUrl}`)

    return new NextResponse(responseBody, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    })
  } catch (error) {
    console.error(
      `[fms-proxy] Failed to proxy ${request.method} ${targetUrl}:`,
      error
    )
    return NextResponse.json(
      { message: "Proxy error: could not reach backend" },
      { status: 502 }
    )
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - auth-bridge (Local auth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static media extensions
     */
    '/((?!api|auth-bridge|_next/static|_next/image|favicon.ico|.*\\.(?:mp4|png|jpg|jpeg|svg|gif|webp)$).*)',
  ],
}
