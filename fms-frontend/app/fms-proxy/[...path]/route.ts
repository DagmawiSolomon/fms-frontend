import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const FMS_BASE = "https://fms-app-production-5b62.up.railway.app"

async function handler(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const { search } = request.nextUrl
  const upstreamPath = "/" + path.join("/")
  const targetUrl = `${FMS_BASE}${upstreamPath}${search}`

  // Build forwarded headers — drop hop-by-hop and host headers
  const forwardHeaders = new Headers()
  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase()
    if (
      lower === "host" ||
      lower === "connection" ||
      lower === "keep-alive" ||
      lower === "te" ||
      lower === "trailers" ||
      lower === "transfer-encoding" ||
      lower === "upgrade" ||
      lower === "origin" ||
      lower === "referer"
    )
      return
    forwardHeaders.set(key, value)
  })

  // Inject Authorization from cookie if not already present
  if (!forwardHeaders.has("authorization")) {
    const cookieStore = await cookies()
    const token = cookieStore.get("fms_token")?.value
    if (token) {
      forwardHeaders.set("Authorization", `Bearer ${token}`)
      console.log(`[fms-proxy] Injected token for ${upstreamPath}`)
    } else {
      console.log(`[fms-proxy] No token for ${upstreamPath}`)
    }
  }

  const hasBody = request.method !== "GET" && request.method !== "HEAD"

  try {
    const upstream = await fetch(targetUrl, {
      method: request.method,
      headers: forwardHeaders,
      body: hasBody ? request.body : undefined,
      // @ts-ignore - required for streaming body
      duplex: "half",
    })

    const responseBody = await upstream.arrayBuffer()
    const contentType = upstream.headers.get("content-type") ?? "application/octet-stream"
    console.log(`[fms-proxy] ${upstream.status} ${request.method} ${targetUrl}`)

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

    return new NextResponse(responseBody, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    })
  } catch (error) {
    console.error(`[fms-proxy] Failed to proxy ${request.method} ${targetUrl}:`, error)
    return NextResponse.json(
      { message: "Proxy error: could not reach backend" },
      { status: 502 }
    )
  }
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const PATCH = handler
export const DELETE = handler
export const HEAD = handler
export const OPTIONS = handler
