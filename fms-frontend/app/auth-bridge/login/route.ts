import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Call the production backend
    const response = await fetch("https://fms-app-production-5b62.up.railway.app/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    // Extract token
    const token = data.token || data.accessToken || data.data?.token || data.data?.accessToken

    if (token) {
      // Set HttpOnly cookie
      const cookieStore = await cookies()
      cookieStore.set("fms_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Login route handler error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
