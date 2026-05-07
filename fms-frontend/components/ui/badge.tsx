import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-none border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "border-white/10 bg-white/[0.06] text-foreground [a]:hover:bg-white/[0.1]",
        secondary:
          "border-white/10 bg-white/[0.08] text-foreground [a]:hover:bg-white/[0.12]",
        destructive:
          "border-destructive/20 bg-destructive/15 text-destructive focus-visible:ring-destructive/20 [a]:hover:bg-destructive/20",
        outline:
          "border-white/10 bg-transparent text-foreground/90 [a]:hover:bg-white/[0.06] [a]:hover:text-foreground",
        ghost:
          "hover:bg-white/[0.06] hover:text-foreground",
        link: "text-foreground underline-offset-4 hover:underline hover:opacity-80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
