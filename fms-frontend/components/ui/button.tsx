import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-none border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/30 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-white text-black hover:bg-white/90 [a]:hover:bg-white/90",
        outline:
          "border-white/10 bg-white/[0.03] text-foreground hover:bg-white/[0.06] hover:text-foreground aria-expanded:bg-white/[0.06] aria-expanded:text-foreground",
        secondary:
          "bg-white/[0.08] text-foreground hover:bg-white/[0.12] aria-expanded:bg-white/[0.12] aria-expanded:text-foreground",
        ghost:
          "hover:bg-white/[0.06] hover:text-foreground aria-expanded:bg-white/[0.06] aria-expanded:text-foreground",
        destructive:
          "bg-destructive/15 text-destructive hover:bg-destructive/25 focus-visible:border-destructive/40 focus-visible:ring-destructive/20",
        link: "text-foreground underline-offset-4 hover:underline hover:opacity-80",
      },
      size: {
        default: "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-none px-2 text-xs in-data-[slot=button-group]:rounded-none has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-none px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-none has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8 rounded-none",
        "icon-xs":
          "size-6 rounded-none in-data-[slot=button-group]:rounded-none [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-none in-data-[slot=button-group]:rounded-none",
        "icon-lg": "size-9 rounded-none",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
