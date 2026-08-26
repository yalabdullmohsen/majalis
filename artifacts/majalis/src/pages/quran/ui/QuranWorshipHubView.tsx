import "@/styles/quran-worship-hub.css";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearch } from "wouter";
import { Bell, Clock, Download, WifiOff } from "lucide-react";
import { HifzAudioLoopPlayer } from "@/components/quran/HifzAudioLoopPlayer";
import { ReciterDownloadManager } from "@/components/quran/ReciterDownloadManager";
import { AudioLibrarySelectionPanel } from "@/components/audio/AudioLibrarySelectionPanel";
import { usePrayerCountdown } from "@/components/prayer/PrayerCountdownProvider";
import { applyPageSeo } from "@/lib/seo";
import { fetchSurahList, getSurahMeta, type SurahSummary } from "@/lib/quran-api";
import { navigateTo } from "@/lib/navigation-intent";
import { toArabicDigits } from "@/lib/utils";

const OBLIGATORY_KEYS = new Set(["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"]);

function parseSurahParam(raw: string): number {
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1 || n > 114) return 1;
  return n;
}

function SurahSelect({
  id,
  value,
  onChange,
}: {
  id: string;
  value: number;
  onChange: (n: number) => void;
}) {
  const [list, setList] = useState<SurahSummary[]>([]);

  useEffect(() => {
    void fetchSurahList().then(setList);
  }, []);

  return (
    <select
      id={id}
      className="qwh-surah-pick__select"
      value={value}
      onChange={(e) => onChange(Number(e.target.value) || 1)}
      aria-label="اختر السورة"
    >
      {(list.length ? list : [{ number: value, name: getSurahMeta(value).name } as SurahSummary]).map(
        (s) => (
          <option key={s.number} value={s.number}>
            {toArabicDigits(s.number)} — {s.name.replace(/^سُورَةُ\s*/u, "")}
          </option>
        ),
      )}
    </select>
  );
}

export default function QuranWorshipHubView() {
  const search = useSearch();
  const surah = useMemo(() => {
    const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
    return parseSurahParam(params.get("surah") ?? "1");
  }, [search]);

  const { data, countdown } = usePrayerCountdown();
  const next = countdown?.next;
  const obligatoryPrayers = (data?.prayers ?? []).filter((p) => OBLIGATORY_KEYS.has(p.key));

  useEffect(() => {
    const meta = getSurahMeta(surah);
    applyPageSeo({
      title: `مركز العبادة القرآنية — ${meta.name.replace(/^سُورَةُ\s*/u, "")}`,
      description:
        "مواقيت الصلاة، مشغّل تحفيظ A-B، وتنزيل التلاوات للاستماع دون اتصال — ضمن محرك المجلس العلمي.",
      path: `/quran/worship-hub?surah=${surah}`,
    });
  }, [surah]);

  const onSurahChange = (nextSurah: number) => {
    navigateTo(`/quran/worship-hub?surah=${nextSurah}`, { mode: "state" });
  };

  return (
    <div className="page-shell qwh-page" dir="rtl">
      <header className="qwh-hero surface-brand">
        <Clock size={28} className="qwh-hero__icon" aria-hidden="true" />
        <h1 className="qwh-hero__title">مركز العبادة القرآنية</h1>
        <p className="qwh-hero__sub">
          مواقيت الصلاة، التحفيظ المتكرّر، والتلاوات المحفوظة محليًا — بلا خدمات موازية.
        </p>
      </header>

      <section className="qwh-prayer-strip surface-brand" aria-label="مواقيت الصلاة">
        <div className="qwh-prayer-strip__next">
          <Clock className="qwh-prayer-strip__clock" aria-hidden="true" />
          <div>
            <span className="qwh-prayer-strip__label">الصلاة القادمة</span>
            <h2 className="qwh-prayer-strip__name">
              {next ? `${next.name} — ${next.time}` : "جارٍ تجهيز المواقيت…"}
            </h2>
            {countdown?.remainingHms && next ? (
              <p className="qwh-prayer-strip__countdown" aria-live="polite">
                بعد {countdown.remainingHms}
              </p>
            ) : null}
          </div>
        </div>

        {obligatoryPrayers.length > 0 ? (
          <div className="qwh-prayer-strip__grid">
            {obligatoryPrayers.map((p) => (
              <div key={p.key} className="qwh-prayer-chip">
                <span className="qwh-prayer-chip__label">{p.name}</span>
                <span className="qwh-prayer-chip__time">{p.time}</span>
              </div>
            ))}
          </div>
        ) : null}

        <Link href="/prayer-times" className="qwh-prayer-strip__link">
          تفاصيل المواقيت والإمساكية
        </Link>
      </section>

      <section className="qwh-adhan-note">
        <Bell size={16} aria-hidden="true" />
        <span>الأذان يُجدول عبر محرك التطبيق —</span>
        <Link href="/adhan-settings">إعدادات الأذان والتنبيهات</Link>
      </section>

      <section className="qwh-hifz">
        <div className="qwh-hifz__head">
          <h2 className="qwh-section-title">مشغّل التحفيظ</h2>
          <div className="qwh-surah-pick">
            <label htmlFor="qwh-surah-select">السورة</label>
            <SurahSelect id="qwh-surah-select" value={surah} onChange={onSurahChange} />
          </div>
        </div>
        <HifzAudioLoopPlayer key={surah} surah={surah} />
      </section>

      <section className="qwh-library">
        <AudioLibrarySelectionPanel />
      </section>

      <section className="qwh-offline" aria-labelledby="qwh-offline-title">
        <div className="qwh-offline__head">
          <WifiOff size={18} aria-hidden="true" />
          <h2 id="qwh-offline-title" className="qwh-section-title">
            التلاوات دون اتصال
          </h2>
        </div>
        <p className="qwh-offline__hint">
          <Download size={14} aria-hidden="true" />
          تنزيل اختياري لسور القارئ كاملة — يُستخدم تلقائيًا عند انقطاع الشبكة.
        </p>
        <ReciterDownloadManager />
      </section>
    </div>
  );
}
