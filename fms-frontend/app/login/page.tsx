"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useRouter, useSearchParams } from "next/navigation"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { fmsApi, extractAuthToken, normalizeSessionUser } from "@/lib/fms"
import { setAuthToken } from "@/lib/auth"
import { toast } from "sonner"

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

const registerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

type LoginValues = z.infer<typeof loginSchema>
type RegisterValues = z.infer<typeof registerSchema>

export default function AuthPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialMode = searchParams.get("mode") === "register" ? "register" : "login"
  
  const [mode, setMode] = React.useState<"login" | "register">(initialMode)

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  })

  const loginMutation = useMutation({
    mutationFn: (values: LoginValues) => fmsApi.loginUser(values),
    onSuccess: async (payload) => {
      const token = extractAuthToken(payload)
      if (token) {
        setAuthToken(token)
      }
      normalizeSessionUser(payload)
      toast.success("Signed in successfully")
      router.push("/dashboard")
    },
    onError: () => {
      toast.error("Invalid email or password")
    },
  })

  const registerMutation = useMutation({
    mutationFn: (values: RegisterValues) => fmsApi.registerUser(values),
    onSuccess: (payload) => {
      const token = extractAuthToken(payload)
      if (token) {
        setAuthToken(token)
      }
      toast.success("Account created successfully")
      router.push("/dashboard")
    },
    onError: () => {
      toast.error("Registration failed. Email might already be in use.")
    },
  })

  const isPending = loginMutation.isPending || registerMutation.isPending

  return (
    <div className="flex min-h-svh w-full overflow-hidden bg-background">
      {/* Left side - Grainy Gradient */}
      <div className="grainy-gradient hidden w-1/2 border-r lg:flex relative overflow-hidden">
        <div className="absolute bottom-12 left-12 z-10 max-w-md">
          <div className="mb-4 flex items-center gap-2">
            <div className="size-8 border-2 border-white flex items-center justify-center font-bold text-lg rounded-none">F</div>
            <span className="text-xl font-semibold tracking-tight uppercase">Fms Finance</span>
          </div>
          <h1 className="text-4xl font-medium tracking-tight text-foreground">
            Financial Management System
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Precision, transparency, and architectural clarity in enterprise financial operations.
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex w-full flex-col items-center justify-center p-8 lg:w-1/2">
        <div className="w-full max-w-sm space-y-8">
          <div className="flex flex-col space-y-2 text-center lg:text-left transition-all duration-300">
            <h1 className="text-3xl font-medium tracking-tight">
              {mode === "login" ? "Sign in" : "Create account"}
            </h1>
            <p className="text-muted-foreground">
              {mode === "login" 
                ? "Enter your credentials to access your dashboard" 
                : "Join FMS to manage your finances with precision"}
            </p>
          </div>

          <Card className="rounded-none border-0 shadow-none">
            <CardContent className="p-0">
              {mode === "login" ? (
                <form
                  className="grid gap-4"
                  onSubmit={loginForm.handleSubmit((values) => loginMutation.mutate(values))}
                >
                  <div className="space-y-1">
                    <Input 
                      placeholder="Email address" 
                      type="email" 
                      className="h-11 rounded-none border-t-0 border-x-0 border-b focus-visible:ring-0" 
                      {...loginForm.register("email")} 
                    />
                    {loginForm.formState.errors.email && (
                      <p className="text-xs text-destructive">{loginForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Input
                      placeholder="Password"
                      type="password"
                      className="h-11 rounded-none border-t-0 border-x-0 border-b focus-visible:ring-0"
                      {...loginForm.register("password")}
                    />
                    {loginForm.formState.errors.password && (
                      <p className="text-xs text-destructive">{loginForm.formState.errors.password.message}</p>
                    )}
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isPending}
                    className="mt-4 h-11 rounded-none"
                  >
                    {isPending ? "Signing in..." : "Continue to Dashboard"}
                  </Button>
                  <div className="mt-4 flex items-center justify-center">
                    <Button 
                      type="button" 
                      variant="link" 
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => setMode("register")}
                    >
                      Don&apos;t have an account? Sign up
                    </Button>
                  </div>
                </form>
              ) : (
                <form
                  className="grid gap-4"
                  onSubmit={registerForm.handleSubmit((values) => registerMutation.mutate(values))}
                >
                  <div className="space-y-1">
                    <Input 
                      placeholder="Full Name" 
                      className="h-11 rounded-none border-t-0 border-x-0 border-b focus-visible:ring-0" 
                      {...registerForm.register("name")} 
                    />
                    {registerForm.formState.errors.name && (
                      <p className="text-xs text-destructive">{registerForm.formState.errors.name.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Input 
                      placeholder="Email address" 
                      type="email" 
                      className="h-11 rounded-none border-t-0 border-x-0 border-b focus-visible:ring-0" 
                      {...registerForm.register("email")} 
                    />
                    {registerForm.formState.errors.email && (
                      <p className="text-xs text-destructive">{registerForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Input
                      placeholder="Password"
                      type="password"
                      className="h-11 rounded-none border-t-0 border-x-0 border-b focus-visible:ring-0"
                      {...registerForm.register("password")}
                    />
                    {registerForm.formState.errors.password && (
                      <p className="text-xs text-destructive">{registerForm.formState.errors.password.message}</p>
                    )}
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isPending}
                    className="mt-4 h-11 rounded-none"
                  >
                    {isPending ? "Creating account..." : "Create account"}
                  </Button>
                  <div className="mt-4 flex items-center justify-center">
                    <Button 
                      type="button" 
                      variant="link" 
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => setMode("login")}
                    >
                      Already have an account? Sign in
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
