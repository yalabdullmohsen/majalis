import { Link } from "wouter";
import { getSurahMeta } from "@/lib/mushaf/kuwait-mushaf-data";
import type { KuwaitMushafState } from "@/hooks/useKuwaitMushaf";

type Props = {
  mushaf: KuwaitMushafState;
};

export function MushafAyahActions({ mushaf }: Props) {
  const surah = mushaf.pageMeta.surah;
  const meta = getSurahMeta(surah);

  const copyLink = async () => {
    const url = `${window.location.origin}/quran/mushaf?page=${mushaf.page}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* ignore */
    }
  };

  const shareLink = async () => {
    const text = `${meta?.name ?? mushaf.pageMeta.surahName} — صفحة ${mushaf.page} · المصحف (طبعة الكويت)`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "المصحف الشريف", text, url: window.location.href });
      } catch {
        /* ignore */
      }
    } else {
      await copyLink();
    }
  };

  return (
    <div className={`km-actions${mushaf.prefs.hideChrome ? " km-actions--hidden" : ""}`}>
      <Link href={`/quran?surah=${surah}`} className="km-actions__btn">القراءة النصية</Link>
      <Link href={`/quran?surah=${surah}`} className="km-actions__btn">التفسير</Link>
      <Link href="/quran-radio" className="km-actions__btn">الاستماع</Link>
      <button type="button" className="km-actions__btn" onClick={() => void copyLink()}>نسخ الرابط</button>
      <button type="button" className="km-actions__btn" onClick={() => void shareLink()}>مشاركة</button>
      <button type="button" className="km-actions__btn" onClick={() => mushaf.bookmarkCurrent()}>مفضلة</button>
    </div>
  );
}
