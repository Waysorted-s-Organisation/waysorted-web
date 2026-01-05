"use client"

import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { CircleIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const RadioGroup = React.forwardRef<
    React.ElementRef<typeof RadioGroupPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
    return (
        <RadioGroupPrimitive.Root
            ref={ref}
            data-slot="radio-group"
            className={cn("grid gap-3", className)}
            {...props}
        />
    )
})
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

const RadioGroupItem = React.forwardRef<
    React.ElementRef<typeof RadioGroupPrimitive.Item>,
    React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
    return (
        <RadioGroupPrimitive.Item
            ref={ref}
            data-slot="radio-group-item"
            className={cn(
                "border-[#565A5E] text-[#265BD1] focus-visible:ring-[#265BD1]/30 aria-invalid:ring-[#E84C3D]/20 aria-invalid:border-[#E84C3D] aspect-square size-[14px] shrink-0 rounded-full border shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[2px] disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-[#265BD1]",
                className
            )}
            {...props}
        >
            <RadioGroupPrimitive.Indicator
                data-slot="radio-group-indicator"
                className="relative flex items-center justify-center"
            >
                <CircleIcon className="fill-[#265BD1] stroke-[#265BD1] absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2" />
            </RadioGroupPrimitive.Indicator>
        </RadioGroupPrimitive.Item>
    )
})
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

export { RadioGroup, RadioGroupItem }
