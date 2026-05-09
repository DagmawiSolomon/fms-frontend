"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { 
  Tick01Icon, 
  InformationCircleIcon, 
  Alert01Icon, 
  Cancel01Icon, 
  Loading01Icon 
} from "@hugeicons/core-free-icons"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <HugeiconsIcon icon={Tick01Icon} className="size-4" />
        ),
        info: (
          <HugeiconsIcon icon={InformationCircleIcon} className="size-4" />
        ),
        warning: (
          <HugeiconsIcon icon={Alert01Icon} className="size-4" />
        ),
        error: (
          <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
        ),
        loading: (
          <HugeiconsIcon icon={Loading01Icon} className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "rgba(255, 255, 255, 0.1)",
          "--normal-text": "#ffffff",
          "--normal-border": "transparent",
          "--border-radius": "4px",
          "--success-bg": "rgba(34, 197, 94, 0.1)",
          "--success-text": "#22c55e",
          "--success-border": "transparent",
          "--error-bg": "rgba(239, 68, 68, 0.1)",
          "--error-text": "#ef4444",
          "--error-border": "transparent",
          "--warning-bg": "rgba(245, 158, 11, 0.1)",
          "--warning-text": "#f59e0b",
          "--warning-border": "transparent",
          "--info-bg": "rgba(59, 130, 246, 0.1)",
          "--info-text": "#3b82f6",
          "--info-border": "transparent",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast font-medium border flex items-center justify-start gap-3",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
