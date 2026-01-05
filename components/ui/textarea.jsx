import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({
  className,
  ...props
}) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-none placeholder:text-[#565A5E] focus-visible:ring-[#265BD1]/30 aria-invalid:ring-[#E84C3D]/20 aria-invalid:border-[#E84C3D] flex field-sizing-content min-h-[94px] w-full rounded-[6px] bg-[#F3F3F3] px-3 py-2 text-[14px] font-medium text-[#0D1218] shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[2px] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props} />
  );
}

export { Textarea }
