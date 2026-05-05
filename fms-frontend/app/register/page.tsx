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
import { fmsApi, extractAuthToken } from "@/lib/fms"
import { setAuthToken } from "@/lib/auth"
import { toast } from "sonner"

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
})

type RegisterValues = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  })

  const mutation = useMutation({
    mutationFn: (values: RegisterValues) => fmsApi.registerUser(values),
    onSuccess: (payload) => {
      const token = extractAuthToken(payload)
      if (token) {
        setAuthToken(token)
      }
      toast.success("Account created")
      router.push("/dashboard")
    },
  })

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <CardDescription>Register a new FMS user</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          >
            <Input placeholder="Name" {...form.register("name")} />
            <Input placeholder="Email" type="email" {...form.register("email")} />
            <Input
              placeholder="Password"
              type="password"
              {...form.register("password")}
            />
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating..." : "Create account"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => router.push("/login")}>
              Already have an account?
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
