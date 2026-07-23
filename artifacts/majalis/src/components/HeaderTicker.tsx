import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Clock, Repeat2, ScrollText, Heart } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { fetchPrayerTimes, computePrayerCountdown, type PrayerCountdown, type PrayerSlot } from "@/lib/prayer-times";
import { getDailyDhikr, getDailyHadith, getDailyFaida } from "@/lib/daily-content";

type TickerItem = {
  key: string;
  Icon: LucideIcon;
  label: string;
  text: string;
  source?: string;
  href: string;
};

/* عدّاد الصلاة القادمة — نفس منطق PrayerChip في NavBar.tsx حرفيًا (فترة
   السماح 30 دقيقة بعد الأذان)، بتحديث كل دقيقة بدل كل ثانية (كافٍ لشريط
   نصي متحرك، ويتجنّب عرض ثوانٍ متجمّدة بين كل تحديث). */
function usePrayerTickerItem(): TickerItem | null {
  const [cd, setCd] = useState<PrayerCountdown | null>(null);
  useEffect(() => {
    let prayers: PrayerSlot[] = [];
    let interval: ReturnType<typeof setInterval> | undefined;
    fetchPrayerTimes()
      .then((payload) => {
        prayers = payload.prayers;
        setCd(computePrayerCountdown(prayers));
        interval = setInterval(() => setCd(computePrayerCountdown(prayers)), 60_000);
      })
      .catch(() => {});
    return () => { if (interval) clearInterval(interval); };
  }, []);

  if (!cd?.next) return null;
  const inGrace = cd.sinceSeconds != null;
  const name = inGrace && cd.graceNextSlot ? cd.graceNextSlot.name : cd.next.name;
  const hms = inGrace && cd.graceNextHms ? cd.graceNextHms : cd.remainingHms;
  const hm = hms.split(":").slice(0, 2).join(":");
  return {
    key: "prayer",
    Icon: Clock,
    label: `المتبقي على صلاة ${name}`,
    text: hm,
    href: "/prayer-times",
  };
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/** عناصر ثابتة يومية — نفس مصدر «مجلس اليوم» (daily-content.ts) بلا تكرار
    منطق جديد: أذكار/حديث/فائدة معتمدة مسبقًا بنصّها الحرفي ومصدرها. */
function useDailyContentItems(): TickerItem[] {
  return useMemo(() => {
    const items: TickerItem[] = [];
    try {
      const dhikr = getDailyDhikr();
      if (dhikr?.text) {
        items.push({ key: "dhikr", Icon: Repeat2, label: dhikr.category || "ذكر", text: dhikr.text, source: dhikr.source, href: "/adhkar" });
      }
    } catch { /* تجاهل — عنصر واحد ناقص لا يوقف بقية الشريط */ }
    try {
      const hadith = getDailyHadith();
      if (hadith?.text) {
        items.push({ key: "hadith", Icon: ScrollText, label: "حديث", text: hadith.text, source: `${hadith.narrator} — ${hadith.source}`, href: "/hadith" });
      }
    } catch { /* */ }
    try {
      const faida = getDailyFaida();
      if (faida?.text) {
        items.push({ key: "faida", Icon: Heart, label: "فائدة", text: faida.text, source: faida.source, href: "/fawaid" });
      }
    } catch { /* */ }
    return items;
  }, []);
}

function TickerEntry({ item }: { item: TickerItem }) {
  return (
    <Link href={item.href} className="header-ticker__item">
      <item.Icon size={13} strokeWidth={1.8} className="header-ticker__icon" aria-hidden="true" />
      <span className="header-ticker__label">{item.label}:</span>
      <span className="header-ticker__text">{item.text}</span>
      {item.source && <span className="header-ticker__source">— {item.source}</span>}
    </Link>
  );
}

/** شريط علوي متحرك يعرض عدّاد الصلاة القادمة بالتناوب مع محتوى معتمد
    (ذكر/حديث/فائدة من نفس مصدر «مجلس اليوم»)، بدل زر البحث في الهيدر.
    CSS Marquee بلا مكتبات؛ يتوقف عند hover/لمس، ويتحول لتناوب ثابت بلا
    حركة عند prefers-reduced-motion. */
export function HeaderTicker() {
  const prayerItem = usePrayerTickerItem();
  const dailyItems = useDailyContentItems();
  const reducedMotion = useReducedMotion();
  const [staticIndex, setStaticIndex] = useState(0);

  const items = useMemo(
    () => (prayerItem ? [prayerItem, ...dailyItems] : dailyItems),
    [prayerItem, dailyItems],
  );

  useEffect(() => {
    if (!reducedMotion || items.length === 0) return;
    const t = setInterval(() => setStaticIndex((i) => (i + 1) % items.length), 6000);
    return () => clearInterval(t);
  }, [reducedMotion, items.length]);

  if (items.length === 0) {
    return <div className="header-ticker header-ticker--empty" aria-hidden="true" />;
  }

  if (reducedMotion) {
    return (
      <div className="header-ticker header-ticker--static" role="status" aria-live="polite">
        <TickerEntry item={items[staticIndex % items.length]} />
      </div>
    );
  }

  return (
    <div className="header-ticker" role="status" aria-label="شريط معلومات متحرك">
      <div className="header-ticker__track">
        {[...items, ...items].map((item, i) => (
          <TickerEntry key={`${item.key}-${i}`} item={item} />
        ))}
      </div>
    </div>
  );
}
