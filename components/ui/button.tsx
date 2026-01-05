import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[8px] text-[14px] font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-[#265BD1] text-white shadow-xs hover:bg-[#1F4AA9]",
        destructive:
          "bg-[#E84C3D] text-white shadow-xs hover:bg-[#D63C2F] focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "border border-[#CFD0D1] bg-white shadow-xs hover:bg-[#F3F3F3] hover:text-[#265BD1]",
        secondary:
          "bg-[#F3F3F3] text-[#565A5E] shadow-xs hover:bg-[#E8EFFC] hover:text-[#265BD1]",
        ghost:
          "hover:bg-[#E8EFFC] hover:text-[#265BD1]",
        link: "text-[#265BD1] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-[36px] px-[11px] py-[6px] has-[>svg]:px-3",
        sm: "h-8 rounded-[8px] gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-[8px] px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
