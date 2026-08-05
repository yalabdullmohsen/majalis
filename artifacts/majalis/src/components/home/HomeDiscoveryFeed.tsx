import { useMemo, useState } from "react";
import { Link } from "wouter";
import { BookMarked, BookOpen, RotateCw, Scroll, Share2, Target } from "lucide-react";
import {
  getDailyAyah,
  getDailyDhikr,
  getDailyFaida,
  getDailyHadith,
} from "@/lib/daily-content";
import { shareContent } from "@/lib/share";

type FeedKind = "ayah" | "hadith" | "dhikr" | "faida" | "quiz";

type ShareStatus = "idle" | "shared" | "copied" | "error";

/**
 * Feed اكتشاف يومي منظّم — آية، حديث، ذكر، فائدة، واختبار سريع.
 * بلا تعليقات عامة أو تفاعل اجتماعي مفتوح.
 */
export function HomeDiscoveryFeed() {
  const items = useMemo(() => {
    const ayah = getDailyAyah();
    const hadith = getDailyHadith();
    const dhikr = getDailyDhikr();
    const faida = getDailyFaida();
    return [
      {
        kind: "ayah" as const,
        eyebrow: "آية اليوم",
        title: ayah.reference,
        body: ayah.text,
        meta: ayah.meaning,
        href: "/mushaf",
        shareType: "ayah" as const,
        shareRef: ayah.reference,
      },
      {
        kind: "hadith" as const,
        eyebrow: "حديث صحيح",
        title: hadith.source,
        body: hadith.text,
        meta: hadith.meaning,
        href: "/hadith",
        shareType: "hadith" as const,
        shareRef: `${hadith.source}${hadith.grade ? ` · ${hadith.grade}` : ""}`,
      },
      {
        kind: "dhikr" as const,
        eyebrow: "ذكر اليوم",
        title: dhikr.category ?? "ذكر",
        body: dhikr.text,
        meta: dhikr.source ?? "من السنة",
        href: "/adhkar",
        shareType: "dhikr" as const,
        shareRef: dhikr.category ?? "ذكر",
      },
      {
        kind: "faida" as const,
        eyebrow: "فائدة علمية",
        title: faida.category,
        body: faida.text,
        meta: faida.source ?? "المجلس العلمي",
        href: "/fawaid",
        shareType: "fawaid" as const,
        shareRef: faida.category,
      },
      {
        kind: "quiz" as const,
        eyebrow: "اختبار سريع",
        title: "سين جيم",
        body: "سؤال واحد يعزّز ما قرأت اليوم — بلا منافسة اجتماعية.",
        meta: "مستويات متدرجة",
        href: "/quiz",
        shareType: "quiz" as const,
        shareRef: "اختبار المجلس العلمي",
      },
    ];
  }, []);

  return (
    <div className="hp-discovery" aria-label="اكتشاف اليوم">
      {items.map((item) => (
        <DiscoveryCard key={item.kind} item={item} />
      ))}
    </div>
  );
}

function DiscoveryCard({
  item,
}: {
  item: {
    kind: FeedKind;
    eyebrow: string;
    title: string;
    body: string;
    meta: string;
    href: string;
    shareType: "ayah" | "hadith" | "dhikr" | "fawaid" | "quiz" | "lesson";
    shareRef: string;
  };
}) {
  const [status, setStatus] = useState<ShareStatus>("idle");
  const Icon = iconFor(item.kind);

  async function onShare() {
    const result = await shareContent({
      type: item.shareType,
      text: item.body,
      reference: `${item.shareRef} — المجلس العلمي`,
      url: `https://majlisilm.com${item.href}`,
    });
    setStatus(result === "error" ? "error" : result);
    window.setTimeout(() => setStatus("idle"), 2200);
  }

  return (
    <article className={`hp-discovery__card hp-discovery__card--${item.kind}`}>
      <header className="hp-discovery__head">
        <span className="hp-discovery__icon" aria-hidden="true">
          <Icon size={16} strokeWidth={1.9} />
        </span>
        <div>
          <p className="hp-discovery__eyebrow">{item.eyebrow}</p>
          <h3 className="hp-discovery__title">{item.title}</h3>
        </div>
      </header>
      <p className="hp-discovery__body" lang="ar" dir="rtl">
        {item.body}
      </p>
      <p className="hp-discovery__meta">{item.meta}</p>
      <footer className="hp-discovery__actions">
        <Link href={item.href} className="hp-discovery__link">
          افتح
        </Link>
        <button
          type="button"
          className="hp-discovery__share"
          onClick={onShare}
          aria-label={`مشاركة ${item.eyebrow}`}
        >
          <Share2 size={14} strokeWidth={2} aria-hidden="true" />
          {status === "shared"
            ? "تمت المشاركة"
            : status === "copied"
              ? "نُسخ"
              : status === "error"
                ? "تعذّر"
                : "مشاركة"}
        </button>
      </footer>
    </article>
  );
}

function iconFor(kind: FeedKind) {
  switch (kind) {
    case "ayah":
      return BookOpen;
    case "hadith":
      return Scroll;
    case "dhikr":
      return RotateCw;
    case "faida":
      return BookMarked;
    case "quiz":
      return Target;
  }
}
