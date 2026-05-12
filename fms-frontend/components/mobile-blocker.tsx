"use client"

import { useEffect, useState } from "react"

export function MobileBlocker() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black p-8 text-center lg:hidden">
      <div className="max-w-xs space-y-2">
        <h1 className="text-2xl font-medium tracking-tight text-white">
          Hey 👋
        </h1>
        <p className="text-lg text-white/80 leading-relaxed">
          This app works best on a larger screen for now. Check back Soon
        </p>
      </div>
    </div>
  )
}
