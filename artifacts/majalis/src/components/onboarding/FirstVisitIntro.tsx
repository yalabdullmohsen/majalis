/**
 * شاشة الترحيب عند أول دخول — مرة واحدة فقط.
 * بلا lucide (بوابة LCP) — أيقونات SVG مضمّنة خفيفة.
 * قراءة موضع المصحف من التخزين مباشرة بلا سحب حزمة المصحف.
 */
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
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

function resolveAdhkarHref(): string {
  try {
    const hour = new Date().getHours();
    return hour >= 15 ? "/adhkar/evening" : "/adhkar/morning";
  } catch {
    return "/adhkar";
  }
}

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
    id: "wird",
    title: "ورد اليوم",
    desc: "ثبّت وردك",
    href: "/daily-wird",
    tone: "gold",
    icon: <IntroIcon d="M12 3l2.2 6.6H21l-5.4 3.9 2.1 6.5L12 16.6 6.3 20l2.1-6.5L3 9.6h6.8z" />,
  },
  {
    id: "lessons",
    title: "دروس اليوم",
    desc: "دروس قريبة",
    href: "/lessons",
    tone: "teal",
    icon: <IntroIcon d="M22 10v6M2 10l10-5 10 5-10 5zM6 12v5c3 3 9 3 12 0v-5" />,
  },
  {
    id: "adhkar",
    title: "الأذكار",
    desc: "صباح ومساء",
    href: "/adhkar",
    tone: "mint",
    icon: <IntroIcon d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z" />,
  },
];

const START_HERE: Tile[] = [
  {
    id: "quran",
    title: "القرآن الكريم",
    desc: "مصحف وتلاوة وتفسير",
    href: "/quran-hub",
    tone: "green",
    icon: <IntroIcon d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z" />,
  },
  {
    id: "fiqh",
    title: "الفقه",
    desc: "أبواب الأحكام",
    href: "/fiqh",
    tone: "teal",
    icon: <IntroIcon d="M12 3v18M5 8h14M7 8c0 4 2.5 7 5 9 2.5-2 5-5 5-9" />,
  },
  {
    id: "seerah",
    title: "السيرة",
    desc: "سيرة النبي ﷺ",
    href: "/seerah",
    tone: "gold",
    icon: <IntroIcon d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0zm9-4v4l3 2" />,
  },
  {
    id: "prophets",
    title: "قصص الأنبياء",
    desc: "سير الرسل",
    href: "/prophets",
    tone: "mint",
    icon: <IntroIcon d="M12 2l3 7h7l-5.5 4.5L18 22l-6-4-6 4 1.5-8.5L2 9h7z" />,
  },
  {
    id: "hadith",
    title: "الحديث",
    desc: "علوم السنة",
    href: "/hadith",
    tone: "green",
    icon: <IntroIcon d="M14 2H6a2 2 0 0 0-2 2v16l4-2 4 2 4-2 4 2V8z" />,
  },
  {
    id: "history",
    title: "التاريخ الإسلامي",
    desc: "عصور ودول",
    href: "/tarikh-islami",
    tone: "gold",
    icon: <IntroIcon d="M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6" />,
  },
];

const TODAY_SUGGESTIONS = [
  { title: "اقرأ صفحة من المصحف", desc: "ثبّت وردك اليومي من القرآن", href: "/mushaf" },
  { title: "أذكار وقتك", desc: "تابع أذكار الصباح أو المساء بعدد التكرار", href: "/adhkar" },
  { title: "درس علمي قريب", desc: "تصفّح دروس اليوم والقادمة", href: "/lessons" },
  { title: "قصة نبي", desc: "عبرة قصيرة من قصص الأنبياء", href: "/prophets" },
] as const;

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

  const dayIdx = useMemo(() => {
    try {
      return Math.floor(Date.now() / 86_400_000) % TODAY_SUGGESTIONS.length;
    } catch {
      return 0;
    }
  }, []);
  const suggestion = TODAY_SUGGESTIONS[dayIdx]!;

  const finish = useCallback(
    (href?: string) => {
      markFirstVisitIntroSeen();
      try {
        localStorage.setItem("majlis-home-welcomed-v1", "1");
      } catch {
        /* ignore */
      }
      onContinue();
      if (href && href !== "/") navigateTo(href, { mode: "state" });
    },
    [onContinue],
  );

  const goQuick = useCallback(
    (tile: Tile) => {
      const href =
        tile.id === "adhkar"
          ? resolveAdhkarHref()
          : tile.id === "mushaf"
            ? resolveStartHref()
            : tile.href;
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
            ابدأ وردك، تابع قراءتك، وتصفح العلم الشرعي بسهولة.
          </p>
          <div className="first-visit-intro__hero-actions">
            <button
              type="button"
              className="first-visit-intro__btn first-visit-intro__btn--primary"
              onClick={() => finish(resolveStartHref())}
            >
              ابدأ الآن
            </button>
            <button
              type="button"
              className="first-visit-intro__btn first-visit-intro__btn--ghost"
              onClick={() => finish("/sections")}
            >
              تصفح الأقسام
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

        <section className="first-visit-intro__section" aria-labelledby="fvi-start">
          <h2 id="fvi-start" className="first-visit-intro__section-title">
            ابدأ من هنا
          </h2>
          <ul className="first-visit-intro__start">
            {START_HERE.map((tile) => (
              <li key={tile.id}>
                <button
                  type="button"
                  className={`first-visit-intro__tile first-visit-intro__tile--${tile.tone}`}
                  onClick={() => finish(tile.href)}
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

        <section className="first-visit-intro__section" aria-labelledby="fvi-today">
          <h2 id="fvi-today" className="first-visit-intro__section-title">
            اقتراح اليوم
          </h2>
          <button
            type="button"
            className="first-visit-intro__suggest"
            onClick={() =>
              finish(suggestion.href === "/adhkar" ? resolveAdhkarHref() : suggestion.href)
            }
          >
            <strong className="first-visit-intro__suggest-title">{suggestion.title}</strong>
            <span className="first-visit-intro__suggest-desc">{suggestion.desc}</span>
          </button>
        </section>
      </div>
    </div>
  );
}
