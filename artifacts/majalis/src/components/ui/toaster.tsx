import { CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

// ── أيقونة وlون حسب نوع التوست ────────────────────────────────────────────
type ToastVariant = "default" | "success" | "warning" | "destructive" | "info"

const VARIANT_META: Record<
  ToastVariant,
  { Icon: typeof CheckCircle2; color: string }
> = {
  default:     { Icon: Info,          color: "var(--msk-text-2)"  },
  success:     { Icon: CheckCircle2,  color: "var(--msk-gold)"    },
  warning:     { Icon: AlertTriangle, color: "#D97706"             },
  destructive: { Icon: XCircle,       color: "#DC2626"             },
  info:        { Icon: Info,          color: "var(--msk-text-2)"  },
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const v = (variant ?? "default") as ToastVariant
        const { Icon, color } = VARIANT_META[v] ?? VARIANT_META.default

        return (
          <Toast key={id} variant={variant} {...props}>
            {/* أيقونة النوع */}
            <span
              style={{ color, flexShrink: 0, marginTop: "0.05rem" }}
              aria-hidden="true"
            >
              <Icon size={18} strokeWidth={2} />
            </span>

            {/* المحتوى */}
            <div className="grid gap-0.5 min-w-0 flex-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>

            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
