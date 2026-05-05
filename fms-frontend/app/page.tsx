import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { AUTH_TOKEN_COOKIE } from "@/lib/auth"

export default async function Page() {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value
  redirect(token ? "/dashboard" : "/login")
}
