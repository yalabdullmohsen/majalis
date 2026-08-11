/**
 * دمج حالة الضيف المحلية إلى الحساب عند تسجيل الدخول + قراءة السحابة للمتابعة.
 */
import { loadLastPage, saveLastPage, clampMushafPage } from "@/lib/quran-last-page";
import {
  loadTasbeehFromAccount,
  mergeTasbeehAwrad,
  readTasbeehAwrad,
  syncTasbeehToAccount,
  writeTasbeehAwrad,
} from "@/lib/tasbeeh-storage";
import { getResumeItems, saveResumePosition, type ResumeItem } from "@/lib/user-profile-service";

const MUSHAF_RESUME_TYPE = "mushaf_page";
const MUSHAF_RESUME_ID = "last";
const TOAST_DEDUP_KEY = "majalis:cross-device-resume-seen";

export type CrossDeviceResumeHint = {
  page: number;
  title: string;
  href: string;
  sourceLabel: string;
  lastOpenedAt: string;
};

function deviceLabel(): string {
  if (typeof navigator === "undefined") return "جهاز آخر";
  const ua = navigator.userAgent || "";
  if (/iPhone|iPad/i.test(ua)) return "هاتف الآيفون";
  if (/Android/i.test(ua)) return "جهاز أندرويد";
  if (/Mac/i.test(ua)) return "جهاز ماك";
  if (/Windows/i.test(ua)) return "جهاز ويندوز";
  return "جهاز آخر";
}

/** ارفع آخر صفحة مصحف محلية إلى reading_resume وادمج التسبيح. */
export async function mergeGuestStateToCloud(userId: string): Promise<void> {
  if (!userId) return;

  const localPage = await loadLastPage();
  if (localPage != null) {
    await saveResumePosition(userId, {
      content_type: MUSHAF_RESUME_TYPE,
      content_id: MUSHAF_RESUME_ID,
      content_title: `المصحف — صفحة ${localPage}`,
      content_url: `/mushaf/page/${localPage}`,
      thumbnail_icon: "book-open",
      position: { pct: localPage / 604, section: `page:${localPage}`, item_index: localPage },
    }).catch(() => undefined);
  }

  try {
    const local = readTasbeehAwrad();
    const remote = await loadTasbeehFromAccount();
    const merged = mergeTasbeehAwrad(local, remote);
    writeTasbeehAwrad(merged);
    if (merged.length) {
      await syncTasbeehToAccount(merged).catch(() => undefined);
    }
  } catch {
    /* optional */
  }
}

/** اسحب متابعة المصحف من السحابة؛ إن كانت مختلفة عن المحلي اقترح الانتقال. */
export async function detectCrossDeviceMushafResume(
  userId: string,
): Promise<CrossDeviceResumeHint | null> {
  if (!userId) return null;
  const items = await getResumeItems(userId).catch(() => [] as ResumeItem[]);
  const mushaf = items.find((i) => i.content_type === MUSHAF_RESUME_TYPE);
  if (!mushaf) return null;

  const cloudPage = clampMushafPage(
    Number(mushaf.position?.item_index) ||
      Number(String(mushaf.position?.section || "").replace(/\D/g, "")) ||
      0,
  );
  if (cloudPage < 1) return null;

  const localPage = (await loadLastPage()) ?? 0;
  if (cloudPage === localPage) return null;

  const seen = sessionStorage.getItem(TOAST_DEDUP_KEY);
  const stamp = `${cloudPage}:${mushaf.last_opened_at}`;
  if (seen === stamp) return null;
  sessionStorage.setItem(TOAST_DEDUP_KEY, stamp);

  return {
    page: cloudPage,
    title: mushaf.content_title || `صفحة ${cloudPage}`,
    href: mushaf.content_url || `/mushaf/page/${cloudPage}`,
    sourceLabel: deviceLabel(),
    lastOpenedAt: mushaf.last_opened_at,
  };
}

export async function applyCloudMushafPage(page: number): Promise<void> {
  await saveLastPage(page);
}
