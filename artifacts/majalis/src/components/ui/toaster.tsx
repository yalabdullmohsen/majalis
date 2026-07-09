import { CheckCircle2, AlertTriangle, XCircle, Info, Bell } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

type ToastVariant = "default" | "success" | "warning" | "destructive" | "info"

const VARIANT_META: Record<ToastVariant, { Icon: typeof CheckCircle2 }> = {
  default:     { Icon: Bell          },
  success:     { Icon: CheckCircle2  },
  warning:     { Icon: AlertTriangle },
  destructive: { Icon: XCircle       },
  info:        { Icon: Info          },
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const v = (variant ?? "default") as ToastVariant
        const meta = VARIANT_META[v] ?? VARIANT_META.default

        return (
          <Toast key={id} variant={variant} {...props}
          >
            {/* أيقونة النوع */}
            <span
              className="msk-toast__icon-wrap"
              aria-hidden="true"
            >
              <meta.Icon size={16} strokeWidth={2.2} />
            </span>

            {/* المحتوى */}
            <div className="msk-toast__body">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>

            {action && <div className="msk-toast__action">{action}</div>}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
