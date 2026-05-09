import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const token = request.cookies.get("fms_token")?.value

  // If we have a token and we are hitting the proxy, we can try to inject it
  // However, Next.js rewrites in next.config.mjs are hard to modify headers for dynamically in middleware
  // A better approach is to handle the proxying in the middleware itself for these cases
  
  if (request.nextUrl.pathname.startsWith("/fms-proxy/")) {
    const path = request.nextUrl.pathname.replace("/fms-proxy/", "")
    const targetUrl = new URL(path, "https://fms-app-production-5b62.up.railway.app")
    
    // Add query params
    request.nextUrl.searchParams.forEach((value, key) => {
      targetUrl.searchParams.set(key, value)
    })

    const headers = new Headers(request.headers)
    if (token) {
      headers.set("Authorization", `Bearer ${token}`)
    }

    return NextResponse.rewrite(targetUrl, {
      request: {
        headers: headers,
      },
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/fms-proxy/:path*"],
}
