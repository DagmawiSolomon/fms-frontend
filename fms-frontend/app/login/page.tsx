"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useRouter, useSearchParams } from "next/navigation"
import { z } from "zod"
import Image from "next/image"
import { Suspense } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { fmsApi, extractAuthToken, normalizeSessionUser } from "@/lib/fms"
import { setAuthToken } from "@/lib/auth"
import { toast } from "sonner"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"

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

function AuthContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialMode = searchParams.get("mode") === "register" ? "register" : "login"

  const [mode, setMode] = React.useState<"login" | "register">(initialMode)
  const [showPassword, setShowPassword] = React.useState(false)

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
      {/* Left side - Auth Image */}
      <div className="hidden lg:w-[65%] lg:flex relative overflow-hidden bg-background">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src="/ascii-art.mp4" type="video/mp4" />
        </video>
        {/* Gradient overlay to smoothly blend the video into the sidebar */}
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-r from-transparent to-sidebar z-10 pointer-events-none" />
      </div>

      {/* Right side - Form */}
      <div className="flex w-full flex-col items-center justify-center lg:w-[35%] bg-sidebar bg-noise text-sidebar-foreground p-6 sm:p-8">
        <div className="w-full max-w-sm flex flex-col gap-4">
          <div className="flex flex-col gap-0 text-center lg:text-left transition-all duration-300">
            <h1 className="text-3xl tracking-tight text-foreground font-heading">
              {mode === "login" ? "Welcome to FMS" : "Create an account"}
            </h1>
          </div>

          <Card className="rounded-none border-0 shadow-none bg-transparent">
            <CardContent className="p-0">
              {mode === "login" ? (
                <form
                  className="flex flex-col gap-6"
                  onSubmit={loginForm.handleSubmit((values) => loginMutation.mutate(values))}
                >
                  <div className="grid gap-2">
                    <Label htmlFor="email" className="text-md text-foreground">Email address</Label>
                    <Input
                      id="email"
                      placeholder="name@example.com"
                      type="email"
                      className="h-11 bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-white/20"
                      {...loginForm.register("email")}
                    />
                    {loginForm.formState.errors.email && (
                      <p className="text-xs text-destructive">{loginForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-md text-foreground">Password</Label>
                      <Link
                        href="/forgot-password"
                        className="text-xs text-blue-500 hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        placeholder="••••••••"
                        type={showPassword ? "text" : "password"}
                        className="h-11 bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-white/20 pr-10"
                        {...loginForm.register("password")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground outline-none"
                      >
                        {showPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                    {loginForm.formState.errors.password && (
                      <p className="text-xs text-destructive">{loginForm.formState.errors.password.message}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="keep-me-logged-in" />
                    <Label
                      htmlFor="keep-me-logged-in"
                      className="text-sm font-normal leading-none cursor-pointer text-muted-foreground"
                    >
                      Keep me logged in
                    </Label>
                  </div>
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="h-11 font-heading"
                  >
                    {isPending ? "Signing in..." : "Continue to Dashboard"}
                  </Button>
                  <div className="flex items-center justify-center text-sm text-muted-foreground">
                    Don&apos;t have an account?{" "}
                    <button
                      type="button"
                      className="ml-1 text-blue-500 underline underline-offset-4 hover:text-blue-400"
                      onClick={() => setMode("register")}
                    >
                      Sign up
                    </button>
                  </div>
                </form>
              ) : (
                <form
                  className="flex flex-col gap-6"
                  onSubmit={registerForm.handleSubmit((values) => registerMutation.mutate(values))}
                >
                  <div className="grid gap-2">
                    <Label htmlFor="reg-name" className="text-md text-foreground">Full Name</Label>
                    <Input
                      id="reg-name"
                      placeholder="John Doe"
                      className="h-11 bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-white/20"
                      {...registerForm.register("name")}
                    />
                    {registerForm.formState.errors.name && (
                      <p className="text-xs text-destructive">{registerForm.formState.errors.name.message}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="reg-email" className="text-md text-foreground">Email address</Label>
                    <Input
                      id="reg-email"
                      placeholder="name@example.com"
                      type="email"
                      className="h-11 bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-white/20"
                      {...registerForm.register("email")}
                    />
                    {registerForm.formState.errors.email && (
                      <p className="text-xs text-destructive">{registerForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="reg-password" className="text-md text-foreground">Password</Label>
                    <div className="relative">
                      <Input
                        id="reg-password"
                        placeholder="••••••••"
                        type={showPassword ? "text" : "password"}
                        className="h-11 bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-white/20 pr-10"
                        {...registerForm.register("password")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground outline-none"
                      >
                        {showPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                    {registerForm.formState.errors.password && (
                      <p className="text-xs text-destructive">{registerForm.formState.errors.password.message}</p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="h-11 font-heading"
                  >
                    {isPending ? "Creating account..." : "Create account"}
                  </Button>
                  <div className="flex items-center justify-center text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <button
                      type="button"
                      className="ml-1 text-blue-500 underline underline-offset-4 hover:text-blue-400"
                      onClick={() => setMode("login")}
                    >
                      Sign in
                    </button>
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

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-svh items-center justify-center bg-background">
        <div className="size-8 border-2 border-primary border-t-transparent animate-spin rounded-full" />
      </div>
    }>
      <AuthContent />
    </Suspense>
  )
}
