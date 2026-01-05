"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, ...props }, ref) => {
        return (
            <input
                type={type}
                data-slot="input"
                className={cn(
                    "file:text-[#0D1218] placeholder:text-[#565A5E] selection:bg-[#265BD1] selection:text-white flex h-[36px] w-full min-w-0 rounded-[6px] border-none bg-[#F3F3F3] px-3 py-1 text-[14px] font-medium shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
                    "focus-visible:ring-[#265BD1]/30 focus-visible:ring-[2px]",
                    "aria-invalid:ring-[#E84C3D]/20 aria-invalid:border-[#E84C3D]",
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Input.displayName = "Input"

export { Input }
