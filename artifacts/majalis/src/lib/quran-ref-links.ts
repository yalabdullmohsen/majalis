/**
 * تحويل مراجع قرآنية نصية شائعة إلى رابط قراءة في المصحف عند الإمكان.
 * أمثلة مدعومة: «البقرة:255»، «البقرة 255»، «سورة البقرة آية 255».
 */
import { getSurahList } from "@/lib/quran-api";

function normalize(value: string): string {
  return value
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/سورة\s+/g, "")
    .replace(/آية\s+/g, "")
    .replace(/ايه\s+/g, "")
    .replace(/[^\u0600-\u06FF0-9\s:]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const SURAH_BY_NAME = new Map<string, number>();
for (const s of getSurahList()) {
  SURAH_BY_NAME.set(normalize(s.name), s.number);
  // بدون «ال» أحياناً
  const bare = normalize(s.name).replace(/^ال/, "");
  if (bare.length >= 3 && !SURAH_BY_NAME.has(bare)) SURAH_BY_NAME.set(bare, s.number);
}

export function resolveQuranRefHref(source: string | null | undefined): string | null {
  if (!source) return null;
  const raw = source.trim();
  // نمط: اسم:رقم أو اسم رقم
  const m = raw.match(/^(.+?)[\s:：]+(\d{1,3})\s*$/);
  if (!m) return null;
  const nameKey = normalize(m[1]);
  const ayah = Number(m[2]);
  if (!Number.isFinite(ayah) || ayah < 1 || ayah > 286) return null;
  const surah = SURAH_BY_NAME.get(nameKey) ?? SURAH_BY_NAME.get(nameKey.replace(/^ال/, ""));
  if (!surah) return null;
  return `/quran?surah=${surah}&ayah=${ayah}`;
}
