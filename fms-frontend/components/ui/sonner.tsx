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
      closeButton
      style={
        {
          "--normal-bg": "black",
          "--normal-text": "white",
          "--normal-border": "transparent",
          "--border-radius": "4px",
          "--success-bg": "black",
          "--success-text": "#10b981",
          "--success-border": "transparent",
          "--error-bg": "black",
          "--error-text": "#ef4444",
          "--error-border": "transparent",
          "--warning-bg": "black",
          "--warning-text": "#f59e0b",
          "--warning-border": "transparent",
          "--info-bg": "black",
          "--info-text": "#3b82f6",
          "--info-border": "rgba(59, 130, 246, 0.2)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast font-medium border flex items-center justify-between",
          closeButton: "static !ml-auto !mr-0 border-0 hover:bg-muted/20 text-current opacity-60 hover:opacity-100 transition-all",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
