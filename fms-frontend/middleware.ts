import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const FMS_BASE = "https://fms-app-production-5b62.up.railway.app"

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // Only proxy /fms-proxy/* requests
  if (!pathname.startsWith("/fms-proxy/")) {
    return NextResponse.next()
  }

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
  matcher: ["/fms-proxy/:path*"],
}
