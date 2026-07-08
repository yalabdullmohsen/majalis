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

const VARIANT_META: Record<
  ToastVariant,
  { Icon: typeof CheckCircle2; accent: string; iconBg: string; iconColor: string }
> = {
  default:     { Icon: Bell,          accent: "var(--majalis-emerald)",      iconBg: "var(--majalis-emerald-muted)", iconColor: "var(--majalis-emerald)" },
  success:     { Icon: CheckCircle2,  accent: "var(--majalis-emerald)",      iconBg: "var(--majalis-emerald-muted)", iconColor: "var(--majalis-emerald)" },
  warning:     { Icon: AlertTriangle, accent: "var(--majalis-emerald-deep,#0A5040)", iconBg: "var(--majalis-emerald-soft,#EBF5F0)", iconColor: "var(--majalis-emerald,#0E6E52)" },
  destructive: { Icon: XCircle,       accent: "var(--majalis-danger,#9B1C1C)",     iconBg: "var(--majalis-danger-muted,rgba(155,28,28,0.08))", iconColor: "var(--majalis-danger,#9B1C1C)" },
  info:        { Icon: Info,          accent: "#2563EB",                     iconBg: "#DBEAFE",                      iconColor: "#1D4ED8"                  },
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
            style={{ "--toast-accent": meta.accent } as React.CSSProperties}
          >
            {/* أيقونة النوع */}
            <span
              className="msk-toast__icon-wrap"
              style={{ background: meta.iconBg, color: meta.iconColor } as React.CSSProperties}
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
