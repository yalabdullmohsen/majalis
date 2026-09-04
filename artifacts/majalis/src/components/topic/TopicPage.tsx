/**
 * قالب موضوعي موحّد — اللافتة + الشرائح + الغلاف.
 * المحتوى الشرعي يُمرَّر كما هو عبر children؛ لا توليد نصوص.
 */
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { useLocation, useSearch } from "wouter";
import {
  getTopicTheme,
  type TopicThemeId,
} from "@/config/topic-themes";
import { getSectionAccent } from "@/config/sections.registry";
import { sectionTemplateChrome } from "@/config/section-template";
import { HubCard } from "@/components/ui/HubCard";
import { SectionHero } from "@/components/topic/SectionHero";
import { navigateTo } from "@/lib/navigation-intent";
import "@/styles/components/topic-page.css";
import "@/styles/components/safe-hero.css";

export { SectionHero } from "@/components/topic/SectionHero";

export type TopicBreadcrumbItem = {
  label: string;
  href?: string;
};

export type TopicTab = {
  id: string;
  label: string;
};

export type TopicRelatedItem = {
  href: string;
  title: string;
  description: string;
  badge?: string;
  isCurrent?: boolean;
};

export type TopicQuote = {
  text: string;
  ref: string;
  type?: "ayah" | "hadith";
};

export type TopicPageStatus = "ready" | "loading" | "empty" | "error";

export type TopicPageProps = {
  themeId: TopicThemeId;
  /** مسار القسم — يحقن --section-accent من sections.registry */
  sectionRoute?: string;
  breadcrumb: TopicBreadcrumbItem[];
  eyebrow?: string;
  title: string;
  subtitle?: string;
  quote?: TopicQuote;
  tabs?: TopicTab[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
  /** مزامنة ?tab= في الرابط */
  syncTabParam?: boolean;
  relatedTopics?: TopicRelatedItem[];
  /** عنوان مجموعة البطاقات تحت اللافتة — مثل «أقسام العقيدة والتوحيد» */
  groupTitle?: string;
  status?: TopicPageStatus;
  onRetry?: () => void;
  /** صنف إضافي للصفحة (مثل topic-page--prophets للامتداد الكامل) */
  className?: string;
  children?: ReactNode;
};

function readTabFromSearch(search: string): string | null {
  try {
    const q = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
    return q.get("tab");
  } catch {
    return null;
  }
}

export function TopicPage({
  themeId,
  sectionRoute,
  breadcrumb,
  eyebrow,
  title,
  subtitle,
  quote,
  tabs,
  activeTab,
  onTabChange,
  syncTabParam = true,
  relatedTopics,
  groupTitle,
  status = "ready",
  onRetry,
  className,
  children,
}: TopicPageProps) {
  const theme = getTopicTheme(themeId);
  const baseId = useId();
  const tablistRef = useRef<HTMLDivElement>(null);
  const [pathname] = useLocation();
  const search = useSearch();

  const resolvedTab =
    activeTab ??
    (tabs?.length ? readTabFromSearch(search) ?? tabs[0]!.id : undefined);

  useEffect(() => {
    if (!syncTabParam || !tabs?.length || !resolvedTab) return;
    const fromUrl = readTabFromSearch(search);
    if (fromUrl === resolvedTab) return;
    const next = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
    next.set("tab", resolvedTab);
    const qs = next.toString();
    navigateTo(`${pathname}${qs ? `?${qs}` : ""}`, { mode: "state" });
  }, [resolvedTab, syncTabParam, tabs, search, pathname]);

  const selectTab = useCallback(
    (id: string) => {
      onTabChange?.(id);
      if (syncTabParam) {
        const next = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
        next.set("tab", id);
        const qs = next.toString();
        navigateTo(`${pathname}${qs ? `?${qs}` : ""}`, { mode: "state" });
      }
    },
    [onTabChange, syncTabParam, search, pathname],
  );

  const onTabKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!tabs?.length) return;
    const last = tabs.length - 1;
    let next: number;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      // RTL: يمين = السابق بصرياً في بعض المتصفحات — نوحّد: ArrowLeft → التالي
      e.preventDefault();
      if (e.key === "ArrowLeft") next = index >= last ? 0 : index + 1;
      else next = index <= 0 ? last : index - 1;
    } else if (e.key === "Home") {
      e.preventDefault();
      next = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      next = last;
    } else {
      return;
    }
    const id = tabs[next]!.id;
    selectTab(id);
    const btn = tablistRef.current?.querySelector<HTMLButtonElement>(
      `[data-topic-tab="${id}"]`,
    );
    btn?.focus();
  };

  const sectionAccent = sectionRoute ? getSectionAccent(sectionRoute) : theme.accent;

  return (
    <div
      className={["topic-page", className].filter(Boolean).join(" ")}
      dir="rtl"
      data-topic-theme={theme.id}
      data-section-template="1"
      style={{ "--section-accent": sectionAccent } as CSSProperties}
    >
      <SectionHero
        themeId={themeId}
        accent={sectionAccent}
        breadcrumb={breadcrumb}
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
        quote={quote}
      />

      {groupTitle ? (
        <h2 className="topic-page__group-title" data-section-group-title="1">
          {groupTitle}
        </h2>
      ) : null}

      {tabs && tabs.length > 0 ? (
        <div className="topic-page__tabs-wrap">
          <div
            className="topic-page__tabs"
            role="tablist"
            aria-label={title}
            ref={tablistRef}
          >
            {tabs.map((t, index) => {
              const selected = t.id === resolvedTab;
              const tabId = `${baseId}-tab-${t.id}`;
              const panelId = `${baseId}-panel-${t.id}`;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  id={tabId}
                  data-topic-tab={t.id}
                  className={`topic-page__tab${selected ? " is-active" : ""}`}
                  aria-selected={selected}
                  aria-controls={panelId}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => selectTab(t.id)}
                  onKeyDown={(e) => onTabKeyDown(e, index)}
                  style={
                    selected
                      ? ({ "--topic-accent": theme.accent } as CSSProperties)
                      : undefined
                  }
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="topic-page__body">
        {status === "loading" ? (
          <div className="topic-page__state" aria-busy="true">
            <div className="topic-page__skeleton" />
            <div className="topic-page__skeleton topic-page__skeleton--short" />
            <div className="topic-page__skeleton" />
          </div>
        ) : null}
        {status === "empty" ? (
          <div className="topic-page__state" role="status">
            <p>لا محتوى في هذا القسم حالياً.</p>
          </div>
        ) : null}
        {status === "error" ? (
          <div className="topic-page__state" role="alert">
            <p>
              {typeof navigator !== "undefined" && navigator.onLine === false
                ? "أنت غير متصل بالإنترنت. اتصل بالشبكة ثم أعد المحاولة."
                : "تعذّر تحميل المحتوى. أعد المحاولة بعد لحظات."}
            </p>
            {onRetry ? (
              <button type="button" className="topic-page__retry" onClick={onRetry}>
                إعادة المحاولة
              </button>
            ) : null}
          </div>
        ) : null}
        {status === "ready" ? (
          <>
            {tabs && tabs.length > 0 && resolvedTab
              ? tabs.map((t) => (
                  <div
                    key={t.id}
                    role="tabpanel"
                    id={`${baseId}-panel-${t.id}`}
                    aria-labelledby={`${baseId}-tab-${t.id}`}
                    hidden={t.id !== resolvedTab}
                    className="topic-page__panel"
                  >
                    {t.id === resolvedTab ? children : null}
                  </div>
                ))
              : children}
          </>
        ) : null}

        {relatedTopics && relatedTopics.length > 0 ? (
          <section className="topic-page__related" aria-label="مواضيع ذات صلة">
            <div className="hub-card-grid">
              {relatedTopics.map((r) => (
                <HubCard
                  key={r.href}
                  href={r.href}
                  title={r.title}
                  description={r.description}
                  badge={r.badge ?? (r.isCurrent ? "أنت هنا" : undefined)}
                  featured={Boolean(r.isCurrent)}
                  footer={
                    r.isCurrent ? (
                      <span className="topic-page__here">أنت هنا</span>
                    ) : null
                  }
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}

/** بطاقة محتوى موحّدة داخل TopicPage */
export function TopicCard({
  title,
  body,
  evidence,
  children,
}: {
  title: string;
  body?: string;
  evidence?: Array<{ type?: string; ref: string }>;
  children?: ReactNode;
}) {
  return (
    <article className="topic-card">
      <h3 className="topic-card__title">{title}</h3>
      {body ? <p className="topic-card__body">{body}</p> : null}
      {children}
      {evidence && evidence.length > 0 ? (
        <footer className="topic-card__evidence">
          {evidence.map((e, i) => (
            <span key={`${e.ref}-${i}`} className="topic-card__ref">
              {e.ref}
            </span>
          ))}
        </footer>
      ) : null}
    </article>
  );
}

/** غلاف قسم: يحقن تشريح العقيدة التسعة من section-template.ts */
export function SectionTemplatePage({
  route,
  children,
  eyebrow,
  title,
  subtitle,
  quote,
  groupTitle,
  themeId,
  breadcrumb,
  ...rest
}: { route: string; children?: ReactNode } & Partial<TopicPageProps>) {
  const chrome = sectionTemplateChrome(route, {
    eyebrow,
    title,
    subtitle,
    quote,
    groupTitle,
    themeId,
    breadcrumb,
  });
  return (
    <TopicPage {...chrome} {...rest}>
      {children}
    </TopicPage>
  );
}
