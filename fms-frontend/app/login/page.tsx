"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { fmsApi, extractAuthToken, normalizeSessionUser } from "@/lib/fms"
import { setAuthToken } from "@/lib/auth"
import { toast } from "sonner"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

type LoginValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  const mutation = useMutation({
    mutationFn: (values: LoginValues) => fmsApi.loginUser(values),
    onSuccess: async (payload) => {
      const token = extractAuthToken(payload)
      if (token) {
        setAuthToken(token)
      }
      normalizeSessionUser(payload)
      toast.success("Signed in")
      router.push("/dashboard")
    },
  })

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Access the FMS dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          >
            <Input placeholder="Email" type="email" {...form.register("email")} />
            <Input
              placeholder="Password"
              type="password"
              {...form.register("password")}
            />
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Signing in..." : "Sign in"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => router.push("/register")}>
              Need an account?
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
