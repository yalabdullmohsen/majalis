/**
 * إصدارات التلاوة التعليمية الموثّقة فقط.
 * لا تُعرض مجوّد/معلّم إلا بوجود مورد صوتي مستقل + verified + حقوق واضحة.
 * لا Voice Cloning ولا توليد صوتي بالذكاء الاصطناعي.
 * الأنماط غير الموثّقة تُصنَّف pending_rights_review ولا تُعرض للمستخدم.
 */

export type RecitationStyle = "murattal" | "mujawwad" | "muallim" | "other_verified";

export type RecitationLicenseStatus =
  | "allowed_streaming"
  | "allowed_offline"
  | "pending_rights_review"
  | "blocked";

/** حالة مراجعة حقوق معلّقة — لا تُفعَّل في الواجهة النهائية قبل الاعتماد. */
export const PENDING_RIGHTS_REVIEW = "pending_rights_review" as const;

export type RecitationEdition = {
  editionId: string;
  reciterId: string;
  reciterNameAr: string;
  style: RecitationStyle;
  styleLabelAr: string;
  sourceProvider: string;
  sourceResourceId: string;
  audioType: "ayah" | "chapter";
  chapterAudioAvailable: boolean;
  verseAudioAvailable: boolean;
  timingAvailable: boolean;
  qualityOptions: string[];
  licenseStatus: RecitationLicenseStatus;
  attribution: string;
  streamingAllowed: boolean;
  offlineAllowed: boolean;
  checksum: string | null;
  enabled: boolean;
  verifiedAt: string | null;
};

export const RECITATION_STYLE_LABELS_AR: Record<RecitationStyle, string> = {
  murattal: "مرتل",
  mujawwad: "مجود",
  muallim: "معلم",
  other_verified: "موثّق",
};

export const RECITATION_STYLE_HINTS_AR: Record<Exclude<RecitationStyle, "other_verified">, string> = {
  murattal: "قراءة مرتبة وهادئة مناسبة للورد والمتابعة اليومية.",
  mujawwad: "قراءة أبطأ وأكثر عناية بإظهار أحكام التجويد والمدود.",
  muallim: "قراءة تعليمية مناسبة للتلقين والتكرار والمتابعة.",
};

type RegistryReciter = {
  id: string;
  name: string;
  style: string;
  granularity: string;
  bitrate: number;
  folder: string;
  source: string;
  verified: boolean;
  filesPresent?: number;
  qaPassedAt?: string;
};

function mapStyle(raw: string): RecitationStyle | null {
  const s = raw.trim();
  if (s === "مرتل" || s.toLowerCase() === "murattal") return "murattal";
  if (s === "مجود" || s.toLowerCase() === "mujawwad") return "mujawwad";
  if (s === "معلم" || s === "معلّم" || s.toLowerCase() === "muallim") return "muallim";
  return null;
}

/** يحوّل سجل الصوت المعتمد إلى إصدارات تعليمية — بلا اختراع أنماط. */
export function buildRecitationEditionsFromRegistry(reciters: RegistryReciter[]): RecitationEdition[] {
  const out: RecitationEdition[] = [];
  for (const r of reciters) {
    if (!r.verified) continue;
    const style = mapStyle(r.style);
    if (!style) continue;
    const verseAudioAvailable = r.granularity === "ayah" && (r.filesPresent ?? 0) >= 6236;
    const chapterAudioAvailable = r.granularity === "surah" || verseAudioAvailable;
    if (!verseAudioAvailable && !chapterAudioAvailable) continue;

    out.push({
      editionId: `${r.id}:${style}`,
      reciterId: r.id,
      reciterNameAr: r.name,
      style,
      styleLabelAr: RECITATION_STYLE_LABELS_AR[style],
      sourceProvider: r.source,
      sourceResourceId: r.folder,
      audioType: verseAudioAvailable ? "ayah" : "chapter",
      chapterAudioAvailable,
      verseAudioAvailable,
      timingAvailable: false,
      qualityOptions: [`${r.bitrate}kbps`],
      /* everyayah للعرض داخل التطبيق — تنزيل كامل يحتاج مراجعة حقوق صريحة */
      licenseStatus: "allowed_streaming",
      attribution: `${r.name} — ${r.source} / ${r.folder}`,
      streamingAllowed: true,
      offlineAllowed: false,
      checksum: null,
      enabled: true,
      verifiedAt: r.qaPassedAt ?? null,
    });
  }
  return out;
}

export function stylesForReciter(editions: RecitationEdition[], reciterId: string): RecitationStyle[] {
  return [...new Set(editions.filter((e) => e.reciterId === reciterId).map((e) => e.style))];
}

export function findEdition(
  editions: RecitationEdition[],
  reciterId: string,
  style: RecitationStyle,
): RecitationEdition | undefined {
  return editions.find((e) => e.reciterId === reciterId && e.style === style && e.enabled);
}
