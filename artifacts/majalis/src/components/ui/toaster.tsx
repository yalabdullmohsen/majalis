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
  warning:     { Icon: AlertTriangle, accent: "#D97706",                     iconBg: "#FEF3C7",                      iconColor: "#B45309"                 },
  destructive: { Icon: XCircle,       accent: "var(--majalis-danger,#DC2626)", iconBg: "#FEE2E2",                   iconColor: "#DC2626"                  },
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
