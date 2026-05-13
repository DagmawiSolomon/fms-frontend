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
        
        // Create a temporary container for the report content
        const container = document.createElement("div")
        container.innerHTML = html
        document.body.appendChild(container)
        
        const content = container.querySelector("#report-content")
        if (!content) throw new Error("Report content not found")

        // Dynamically import html2pdf
        const html2pdf = (await import("html2pdf.js")).default

        const opt = {
          margin: 0,
          filename: `Financial_Report_${period}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, letterRendering: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
        }

        // Generate and save the PDF
        await html2pdf().from(content).set(opt).save()
        
        // Clean up
        document.body.removeChild(container)
        
        toast.success("Financial report downloaded successfully")
        
        // Optionally redirect back to dashboard after a short delay
        setTimeout(() => window.close(), 2000)
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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f3f4f6] font-sans text-sm text-slate-600">
      <div className="flex flex-col items-center gap-4 text-center">
        {loading ? (
          <>
            <div className="size-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
            <div className="space-y-1">
              <h1 className="text-lg font-semibold text-slate-900">Generating Formal Report</h1>
              <p className="text-slate-500">Compiling financial data for {period}...</p>
            </div>
          </>
        ) : error ? (
          <div className="p-6 text-sm text-rose-500">{error}</div>
        ) : (
          <div className="space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="size-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
            </div>
            <h1 className="text-lg font-semibold text-slate-900">Report Ready</h1>
            <p className="text-slate-500">The document has been downloaded to your device.</p>
            <p className="text-xs text-slate-400 mt-4">You can close this tab now.</p>
          </div>
        )}
      </div>
    </div>
  )
}

