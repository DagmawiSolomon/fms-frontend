"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { useRole } from "@/components/role-provider"
import { buildQuarterlyReportHtml } from "@/lib/quarterly-report-export"

export default function QuarterlyReportPage() {
  const params = useSearchParams()
  const period = params.get("period") ?? `Q${Math.floor(new Date().getMonth() / 3) + 1}-${new Date().getFullYear()}`
  const { user, role } = useRole()
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const html = await buildQuarterlyReportHtml(period, user ?? null, role)
        if (cancelled) return
        document.open()
        document.write(html)
        document.close()
        setTimeout(() => window.print(), 400)
      } catch (err) {
        console.error(err)
        if (!cancelled) {
          setError("Could not generate the quarterly report.")
          toast.error("Could not generate the quarterly report.")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [period, role, user])

  if (error) {
    return <div className="p-6 text-sm text-rose-500">{error}</div>
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#eee7db] font-serif text-sm text-[#5f5a52]">
      {loading ? "Preparing quarterly report..." : "Opening print dialog..."}
    </div>
  )
}

