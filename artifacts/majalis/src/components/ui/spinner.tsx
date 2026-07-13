import * as React from "react"
import { Loader2Icon, type LucideProps } from "lucide-react"

import { cn } from "@/lib/utils"

const Spinner = React.forwardRef<SVGSVGElement, Omit<LucideProps, "ref">>(
  ({ className, ...props }, ref) => (
    <Loader2Icon
      ref={ref}
      role="status"
      aria-label="جارٍ التحميل"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
)
Spinner.displayName = "Spinner"

export { Spinner }
