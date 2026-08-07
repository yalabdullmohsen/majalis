/**
 * Telemetry-aware Error Boundary — catches unexpected client errors,
 * ships a redacted event to `/api/telemetry/log`, and shows a recoverable UI.
 *
 * Does not freeze the rest of the tree when used as a section boundary.
 * Reuses existing error-boundary styles for visual consistency.
 */

import { Component, useMemo, type ErrorInfo, type ReactNode } from "react";
import { createErrorId } from "@/lib/error-report";
import { logCaughtError, telemetryLogger } from "@/lib/telemetry/logger";
import { safeLocationReload } from "@/lib/safe-reload";
import {
  clearChunkReloadGuard,
  consumeChunkReloadAllowance,
  isChunkLoadError,
} from "@/lib/lazy-with-retry";
import { useLanguage } from "@/components/LanguageProvider";
import "@/styles/components/error-boundary.css";

export type TelemetryBoundaryLabels = {
  title: string;
  body: string;
  chunkBody: string;
  tracking: string;
  retry: string;
  home: string;
  copyId: string;
  copied: string;
};

const DEFAULT_LABELS_AR: TelemetryBoundaryLabels = {
  title: "تعذّر عرض هذا القسم",
  body: "حدث خلل غير متوقع. يمكنك إعادة المحاولة أو العودة للرئيسية دون إعادة تحميل كامل التطبيق.",
  chunkBody: "تعذّر تحميل ملفات الصفحة بعد تحديث المنصة. حدّث الصفحة أو اضغط إعادة المحاولة.",
  tracking: "رقم التتبع",
  retry: "إعادة المحاولة",
  home: "العودة للرئيسية",
  copyId: "نسخ رقم الخطأ",
  copied: "تم النسخ",
};

type BoundaryProps = {
  children: ReactNode;
  /** Optional section name for telemetry fields. */
  name?: string;
  labels?: TelemetryBoundaryLabels;
  /** When true, only replaces this subtree (default). */
  section?: boolean;
};

type BoundaryState = {
  error: Error | null;
  errorId: string;
  copied: boolean;
  componentStack: string | null;
};

export class TelemetryErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = {
    error: null,
    errorId: "",
    copied: false,
    componentStack: null,
  };

  static getDerivedStateFromError(error: Error): Partial<BoundaryState> {
    return {
      error,
      errorId: createErrorId("TEL"),
      copied: false,
      componentStack: null,
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const errorId = this.state.errorId || createErrorId("TEL");
    this.setState({ componentStack: info.componentStack ?? null, errorId });

    logCaughtError(error, {
      component: "TelemetryErrorBoundary",
      section: this.props.name || "app",
      error_id: errorId,
      chunk_load: isChunkLoadError(error),
    });

    telemetryLogger.warn("ui.error_boundary.caught", {
      remote: true,
      fields: {
        error_id: errorId,
        section: this.props.name || "app",
        route: typeof window !== "undefined" ? window.location.pathname : "",
      },
    });

    if (isChunkLoadError(error) && consumeChunkReloadAllowance()) {
      safeLocationReload();
    }
  }

  reset = () => {
    clearChunkReloadGuard();
    this.setState({ error: null, errorId: "", copied: false, componentStack: null });
  };

  goHome = () => {
    this.reset();
    if (typeof window === "undefined") return;
    window.history.pushState(null, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  copyId = async () => {
    const id = this.state.errorId;
    if (!id || typeof navigator === "undefined" || !navigator.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(id);
      this.setState({ copied: true });
    } catch {
      /* ignore */
    }
  };

  render() {
    if (!this.state.error) return this.props.children;

    const labels = this.props.labels || DEFAULT_LABELS_AR;
    const chunkError = isChunkLoadError(this.state.error);
    const isDev = Boolean(import.meta.env?.DEV);

    return (
      <div
        role="alert"
        aria-live="assertive"
        className={this.props.section === false ? "error-boundary-page" : "error-boundary-section"}
        dir="rtl"
      >
        <h2 className="error-boundary-page__title">{labels.title}</h2>
        <p className="error-boundary-page__body">{chunkError ? labels.chunkBody : labels.body}</p>
        <p className="error-boundary-page__id">
          {labels.tracking}: <code>{this.state.errorId}</code>
        </p>
        <div className="error-boundary-page__actions">
          <button type="button" className="error-boundary-btn error-boundary-btn--primary" onClick={this.reset}>
            {labels.retry}
          </button>
          <button type="button" className="error-boundary-btn error-boundary-btn--secondary" onClick={this.goHome}>
            {labels.home}
          </button>
          <button type="button" className="error-boundary-btn error-boundary-btn--ghost" onClick={this.copyId}>
            {this.state.copied ? labels.copied : labels.copyId}
          </button>
        </div>
        {isDev && (
          <details className="error-boundary-page__dev">
            <summary>تفاصيل للمطور</summary>
            <pre>
              {`${this.state.error.name}: ${this.state.error.message}\n\n${this.state.componentStack || ""}\n\n${this.state.error.stack || ""}`}
            </pre>
          </details>
        )}
      </div>
    );
  }
}

/**
 * Hook-friendly wrapper: injects language-aware labels when available,
 * falls back to Arabic defaults for keys not yet in the locale dictionaries.
 */
export function TelemetryErrorBoundaryI18n({
  children,
  name,
  section = true,
}: {
  children: ReactNode;
  name?: string;
  section?: boolean;
}) {
  const { lang } = useLanguage();
  const labels = useMemo<TelemetryBoundaryLabels>(() => {
    if (lang === "en") {
      return {
        title: "This section could not be displayed",
        body: "An unexpected error occurred. You can retry or go home without reloading the whole app.",
        chunkBody: "Page assets failed to load after an update. Refresh or tap retry.",
        tracking: "Tracking ID",
        retry: "Retry",
        home: "Go home",
        copyId: "Copy error ID",
        copied: "Copied",
      };
    }
    return DEFAULT_LABELS_AR;
  }, [lang]);

  return (
    <TelemetryErrorBoundary name={name} section={section} labels={labels}>
      {children}
    </TelemetryErrorBoundary>
  );
}

export default TelemetryErrorBoundary;
