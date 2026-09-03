/**
 * شاشة الترحيب عند أول دخول — مرة واحدة فقط.
 * بلا lucide (بوابة LCP) — أيقونات SVG مضمّنة خفيفة.
 * قراءة موضع المصحف من التخزين مباشرة بلا سحب حزمة المصحف.
 */
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { firstVisitIntroConfig } from "@/config/first-visit-intro";
import { markFirstVisitIntroSeen } from "@/lib/first-visit-intro-state";
import { loadLastPageSync } from "@/lib/quran-last-page";
import { navigateTo } from "@/lib/navigation-intent";
import "@/styles/components/first-visit-intro.css";

type Props = {
  onContinue: () => void;
};

type Tile = {
  id: string;
  title: string;
  desc: string;
  href: string;
  tone: "green" | "mint" | "gold" | "teal";
  icon: ReactNode;
};

type ResumeItem = { id: string; title: string; href: string };

function IntroIcon({ d }: { d: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={d} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const SURAH_SHORT: readonly string[] = [
  "الفاتحة", "البقرة", "آل عمران", "النساء", "المائدة", "الأنعام", "الأعراف", "الأنفال", "التوبة", "يونس",
  "هود", "يوسف", "الرعد", "إبراهيم", "الحجر", "النحل", "الإسراء", "الكهف", "مريم", "طه",
  "الأنبياء", "الحج", "المؤمنون", "النور", "الفرقان", "الشعراء", "النمل", "القصص", "العنكبوت", "الروم",
  "لقمان", "السجدة", "الأحزاب", "سبأ", "فاطر", "يس", "الصافات", "ص", "الزمر", "غافر",
  "فصلت", "الشورى", "الزخرف", "الدخان", "الجاثية", "الأحقاف", "محمد", "الفتح", "الحجرات", "ق",
  "الذاريات", "الطور", "النجم", "القمر", "الرحمن", "الواقعة", "الحديد", "المجادلة", "الحشر", "الممتحنة",
  "الصف", "الجمعة", "المنافقون", "التغابن", "الطلاق", "التحريم", "الملك", "القلم", "الحاقة", "المعارج",
  "نوح", "الجن", "المزمل", "المدثر", "القيامة", "الإنسان", "المرسلات", "النبأ", "النازعات", "عبس",
  "التكوير", "الانفطار", "المطففين", "الانشقاق", "البروج", "الطارق", "الأعلى", "الغاشية", "الفجر", "البلد",
  "الشمس", "الليل", "الضحى", "الشرح", "التين", "العلق", "القدر", "البينة", "الزلزلة", "العاديات",
  "القارعة", "التكاثر", "العصر", "الهمزة", "الفيل", "قريش", "الماعون", "الكوثر", "الكافرون", "النصر",
  "المسد", "الإخلاص", "الفلق", "الناس",
];

function readStoredAyahKey(): string | null {
  try {
    const raw = localStorage.getItem("mj-quran-page-pos-v1");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { ayahKey?: string };
    if (typeof parsed?.ayahKey === "string" && /^\d{1,3}:\d{1,3}$/.test(parsed.ayahKey)) {
      return parsed.ayahKey;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function resolveStartHref(): string {
  try {
    const page = loadLastPageSync();
    const ayahKey = readStoredAyahKey();
    if (page != null && page > 1) {
      return ayahKey
        ? `/mushaf/page/${page}?ayah=${encodeURIComponent(ayahKey)}`
        : `/mushaf/page/${page}`;
    }
  } catch {
    /* ignore */
  }
  return "/mushaf";
}

function readMushafResume(): ResumeItem | null {
  try {
    const page = loadLastPageSync();
    if (page == null || page <= 1) return null;
    const ayahKey = readStoredAyahKey();
    let title = `المصحف · صفحة ${page}`;
    if (ayahKey) {
      const [s, a] = ayahKey.split(":").map(Number);
      if (s >= 1 && s <= 114 && Number.isFinite(a)) {
        title = `${SURAH_SHORT[s - 1]} · آية ${a} · ص ${page}`;
      }
    }
    return {
      id: "mushaf",
      title,
      href: ayahKey
        ? `/mushaf/page/${page}?ayah=${encodeURIComponent(ayahKey)}`
        : `/mushaf/page/${page}`,
    };
  } catch {
    return null;
  }
}

const QUICK: Tile[] = [
  {
    id: "mushaf",
    title: "فتح المصحف",
    desc: "اقرأ مباشرة",
    href: "/mushaf",
    tone: "green",
    icon: <IntroIcon d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5zM12 6v12" />,
  },
  {
    id: "lessons",
    title: "الدروس",
    desc: "دروس اليوم",
    href: "/lessons",
    tone: "teal",
    icon: <IntroIcon d="M22 10v6M2 10l10-5 10 5-10 5zM6 12v5c3 3 9 3 12 0v-5" />,
  },
  {
    id: "prayer",
    title: "مواقيت الصلاة",
    desc: "أذان الكويت",
    href: "/prayer-times",
    tone: "gold",
    icon: <IntroIcon d="M12 6v6l4 2M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z" />,
  },
  {
    id: "search",
    title: "البحث",
    desc: "تفسير وسيرة وفقه",
    href: "/search",
    tone: "mint",
    icon: <IntroIcon d="M21 21l-4.3-4.3M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14z" />,
  },
];

export function FirstVisitIntro({ onContinue }: Props) {
  const [resume, setResume] = useState<ResumeItem[]>(() => {
    const mushaf = readMushafResume();
    return mushaf ? [mushaf] : [];
  });

  useEffect(() => {
    let cancelled = false;
    void import("@/lib/continue-reading")
      .then(({ getContinueReadingEntries }) => {
        if (cancelled) return;
        const lesson = getContinueReadingEntries(6).find((e) => e.section === "lessons");
        if (!lesson) return;
        setResume((prev) => {
          if (prev.some((p) => p.id === "lesson")) return prev;
          return [...prev, { id: "lesson", title: lesson.title, href: lesson.route }].slice(0, 2);
        });
      })
      .catch(() => {
        /* ignore */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const finish = useCallback(
    (href?: string, openSearch = false) => {
      markFirstVisitIntroSeen();
      try {
        localStorage.setItem("majlis-home-welcomed-v1", "1");
      } catch {
        /* ignore */
      }
      onContinue();
      if (openSearch) {
        window.dispatchEvent(new CustomEvent("global-search-open", { detail: { filter: "all" } }));
        return;
      }
      if (href && href !== "/") navigateTo(href, { mode: "state" });
    },
    [onContinue],
  );

  const goQuick = useCallback(
    (tile: Tile) => {
      if (tile.id === "search") {
        finish(undefined, true);
        return;
      }
      const href = tile.id === "mushaf" ? resolveStartHref() : tile.href;
      finish(href);
    },
    [finish],
  );

  if (!firstVisitIntroConfig.enabled) return null;

  return (
    <div className="first-visit-intro" role="region" aria-label="مرحبًا بك في سُنّة" data-first-visit-intro="1">
      <div className="first-visit-intro__pattern" aria-hidden="true" />
      <div className="first-visit-intro__inner">
        <header className="first-visit-intro__hero">
          <div className="first-visit-intro__top-actions">
            <button type="button" className="first-visit-intro__skip" onClick={() => finish()}>
              تخطي
            </button>
          </div>
          <p className="first-visit-intro__badge">سُنّة</p>
          <h1 className="first-visit-intro__title">مرحبًا بك في سُنّة</h1>
          <p className="first-visit-intro__lead">
            المصحف، الدروس، ومواقيت الصلاة — ابدأ من هنا.
          </p>
          <div className="first-visit-intro__hero-actions">
            <button
              type="button"
              className="first-visit-intro__btn first-visit-intro__btn--primary"
              onClick={() => finish(resolveStartHref())}
            >
              ابدأ الآن
            </button>
          </div>
        </header>

        <section className="first-visit-intro__section" aria-labelledby="fvi-quick">
          <h2 id="fvi-quick" className="first-visit-intro__section-title">
            وصول سريع
          </h2>
          <ul className="first-visit-intro__quick">
            {QUICK.map((tile) => (
              <li key={tile.id}>
                <button
                  type="button"
                  className={`first-visit-intro__tile first-visit-intro__tile--${tile.tone}`}
                  onClick={() => goQuick(tile)}
                >
                  <span className="first-visit-intro__tile-icon" aria-hidden="true">
                    {tile.icon}
                  </span>
                  <span className="first-visit-intro__tile-title">{tile.title}</span>
                  <span className="first-visit-intro__tile-desc">{tile.desc}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        {resume.length > 0 ? (
          <section className="first-visit-intro__section" aria-labelledby="fvi-resume">
            <h2 id="fvi-resume" className="first-visit-intro__section-title">
              أكمل من حيث توقفت
            </h2>
            <ul className="first-visit-intro__resume">
              {resume.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="first-visit-intro__resume-card"
                    onClick={() => finish(item.href)}
                  >
                    <span className="first-visit-intro__resume-label">متابعة</span>
                    <span className="first-visit-intro__resume-title">{item.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
