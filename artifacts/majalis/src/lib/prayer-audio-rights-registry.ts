/**
 * سجل حقوق أصوات الصلاة — مصدر الحقيقة للترخيص والإسناد قبل الإنتاج.
 * لا يُعتمد صوت للإنتاج دون approvedForProduction + ترخيص موثّق.
 */
export type AudioRightsStatus =
  | "discovered"
  | "metadata_verified"
  | "license_verified"
  | "rights_uncertain"
  | "audio_validation_failed"
  | "approved_for_preview"
  | "approved_for_notification"
  | "approved_for_in_app_adhan"
  | "rejected"
  | "archived";

export type AudioRightsRecord = {
  audioId: string;
  displayNameAr: string;
  originalFileName: string;
  sourcePlatform: string;
  sourceUrl: string;
  licenseType: string;
  licenseUrl: string;
  attributionRequired: boolean;
  attributionText: string;
  commercialUseAllowed: boolean;
  appEmbeddingAllowed: boolean;
  standaloneDistributionAllowed: boolean;
  notificationCompatible: boolean;
  inAppPlaybackCompatible: boolean;
  approvedForProduction: boolean;
  status: AudioRightsStatus;
  verificationNotes: string;
  celebrityNameRisk: boolean;
  fileChecksum?: string;
  processedDurationSec?: number;
  evidencePath?: string;
};

/** أصوات الحزمة الحالية — موثّقة داخليًا؛ المشاهير غير معتمدين للإنتاج. */
export const PRAYER_AUDIO_RIGHTS_REGISTRY: readonly AudioRightsRecord[] = [
  {
    audioId: "tone-prayer",
    displayNameAr: "تنبيه صلاة",
    originalFileName: "prayer-alert.mp3",
    sourcePlatform: "sunnah-bundle",
    sourceUrl: "/audio/notifications/prayer-alert.mp3",
    licenseType: "internal-app-asset",
    licenseUrl: "/data-licenses",
    attributionRequired: false,
    attributionText: "",
    commercialUseAllowed: true,
    appEmbeddingAllowed: true,
    standaloneDistributionAllowed: false,
    notificationCompatible: true,
    inAppPlaybackCompatible: true,
    approvedForProduction: true,
    status: "approved_for_notification",
    verificationNotes: "نغمة تنبيه قصيرة داخل الحزمة.",
    celebrityNameRisk: false,
    processedDurationSec: 2,
  },
  {
    audioId: "tone-alarm",
    displayNameAr: "رنة منبه واضحة",
    originalFileName: "alarm-clear.mp3",
    sourcePlatform: "sunnah-bundle",
    sourceUrl: "/audio/notifications/alarm-clear.mp3",
    licenseType: "internal-app-asset",
    licenseUrl: "/data-licenses",
    attributionRequired: false,
    attributionText: "",
    commercialUseAllowed: true,
    appEmbeddingAllowed: true,
    standaloneDistributionAllowed: false,
    notificationCompatible: true,
    inAppPlaybackCompatible: true,
    approvedForProduction: true,
    status: "approved_for_notification",
    verificationNotes: "رنة منبه قصيرة.",
    celebrityNameRisk: false,
    processedDurationSec: 2,
  },
  {
    audioId: "tone-quiet",
    displayNameAr: "رنة هادئة",
    originalFileName: "soft-ring.mp3",
    sourcePlatform: "sunnah-bundle",
    sourceUrl: "/audio/notifications/soft-ring.mp3",
    licenseType: "internal-app-asset",
    licenseUrl: "/data-licenses",
    attributionRequired: false,
    attributionText: "",
    commercialUseAllowed: true,
    appEmbeddingAllowed: true,
    standaloneDistributionAllowed: false,
    notificationCompatible: true,
    inAppPlaybackCompatible: true,
    approvedForProduction: true,
    status: "approved_for_notification",
    verificationNotes: "نغمة هادئة قصيرة.",
    celebrityNameRisk: false,
    processedDurationSec: 2,
  },
  {
    audioId: "tone-short",
    displayNameAr: "رنة قصيرة",
    originalFileName: "short-ring.mp3",
    sourcePlatform: "sunnah-bundle",
    sourceUrl: "/audio/notifications/short-ring.mp3",
    licenseType: "internal-app-asset",
    licenseUrl: "/data-licenses",
    attributionRequired: false,
    attributionText: "",
    commercialUseAllowed: true,
    appEmbeddingAllowed: true,
    standaloneDistributionAllowed: false,
    notificationCompatible: true,
    inAppPlaybackCompatible: true,
    approvedForProduction: true,
    status: "approved_for_notification",
    verificationNotes: "نغمة قصيرة.",
    celebrityNameRisk: false,
    processedDurationSec: 1,
  },
  {
    audioId: "silent",
    displayNameAr: "صامت",
    originalFileName: "",
    sourcePlatform: "system",
    sourceUrl: "",
    licenseType: "n/a",
    licenseUrl: "",
    attributionRequired: false,
    attributionText: "",
    commercialUseAllowed: true,
    appEmbeddingAllowed: true,
    standaloneDistributionAllowed: false,
    notificationCompatible: true,
    inAppPlaybackCompatible: true,
    approvedForProduction: true,
    status: "approved_for_notification",
    verificationNotes: "صامت / صوت النظام كـ fallback.",
    celebrityNameRisk: false,
  },
  {
    audioId: "makkah",
    displayNameAr: "تنبيه أذان قصير متوافق مع iOS",
    originalFileName: "adhan-makkah.mp3",
    sourcePlatform: "sunnah-bundle",
    sourceUrl: "/audio/adhan/adhan-makkah.mp3",
    licenseType: "internal-app-asset",
    licenseUrl: "/data-licenses",
    attributionRequired: false,
    attributionText: "",
    commercialUseAllowed: true,
    appEmbeddingAllowed: true,
    standaloneDistributionAllowed: false,
    notificationCompatible: true,
    inAppPlaybackCompatible: true,
    approvedForProduction: true,
    status: "approved_for_notification",
    verificationNotes: "النوع الافتراضي المعروض — بلا نسبة لمؤذن مشهور.",
    celebrityNameRisk: false,
    processedDurationSec: 12,
  },
  {
    audioId: "kuwait",
    displayNameAr: "أذان خليجي قصير",
    originalFileName: "adhan-gulf-short.mp3",
    sourcePlatform: "sunnah-bundle",
    sourceUrl: "/audio/adhan/adhan-gulf-short.mp3",
    licenseType: "internal-app-asset",
    licenseUrl: "/data-licenses",
    attributionRequired: false,
    attributionText: "",
    commercialUseAllowed: true,
    appEmbeddingAllowed: true,
    standaloneDistributionAllowed: false,
    notificationCompatible: true,
    inAppPlaybackCompatible: true,
    approvedForProduction: true,
    status: "approved_for_notification",
    verificationNotes: "مقطع قصير داخلي — وصف جغرافي عام بلا نسبة لمؤذن.",
    celebrityNameRisk: false,
    processedDurationSec: 8,
  },
  {
    audioId: "madinah",
    displayNameAr: "أذان بنمط مدني (معاينة فقط)",
    originalFileName: "adhan-madinah.mp3",
    sourcePlatform: "third-party-cdn",
    sourceUrl: "/audio/adhan/adhan-madinah.mp3",
    licenseType: "rights_uncertain",
    licenseUrl: "",
    attributionRequired: true,
    attributionText: "مصدر خارجي — بانتظار دليل ترخيص فردي.",
    commercialUseAllowed: false,
    appEmbeddingAllowed: false,
    standaloneDistributionAllowed: false,
    notificationCompatible: false,
    inAppPlaybackCompatible: false,
    approvedForProduction: false,
    status: "rights_uncertain",
    verificationNotes: "لا يُعرض كإنتاج حتى اكتمال دليل الترخيص؛ بلا نسبة لمسجد/مؤذن مشهور.",
    celebrityNameRisk: true,
  },
  {
    audioId: "qatami",
    displayNameAr: "تسجيل أذان — غير معتمد للإنتاج",
    originalFileName: "adhan-qatami.mp3",
    sourcePlatform: "third-party-cdn",
    sourceUrl: "/audio/adhan/adhan-qatami.mp3",
    licenseType: "rights_uncertain",
    licenseUrl: "",
    attributionRequired: true,
    attributionText: "اسم مؤذن معروف — مرفوض بلا إثبات حقوق.",
    commercialUseAllowed: false,
    appEmbeddingAllowed: false,
    standaloneDistributionAllowed: false,
    notificationCompatible: false,
    inAppPlaybackCompatible: false,
    approvedForProduction: false,
    status: "rejected",
    verificationNotes: "يُحظر عرض اسم مشهور أو تضمين التسجيل دون إثبات حقوق.",
    celebrityNameRisk: true,
  },
  {
    audioId: "wikimedia-adhan-ogg",
    displayNameAr: "أذان ميداني (ويكيميديا — قيد التحقق الصوتي)",
    originalFileName: "Adhan.ogg",
    sourcePlatform: "wikimedia",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Adhan.ogg",
    licenseType: "CC0-1.0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    attributionRequired: false,
    attributionText: "شكر اختياري: Wikimedia Commons — File:Adhan.ogg (CC0).",
    commercialUseAllowed: true,
    appEmbeddingAllowed: true,
    standaloneDistributionAllowed: false,
    notificationCompatible: false,
    inAppPlaybackCompatible: false,
    approvedForProduction: false,
    status: "license_verified",
    verificationNotes: "صفحة الأصل ودليل الترخيص محفوظان؛ المدة ~42ث — غير صالح لإشعار iOS دون قصّ معتمد؛ بانتظار فحص جودة الألفاظ قبل الإنتاج.",
    celebrityNameRisk: false,
    fileChecksum: "faeb03e4338554fb8b54dba98ed4949648615b58e991bbd560a89f4837dde413",
    processedDurationSec: 42,
    evidencePath: "docs/audio-rights/evidence/wikimedia-adhan-ogg-2026-09-13.html",
  },
  {
    audioId: "wikimedia-beautiful-adhan",
    displayNameAr: "أذان ميداني طويل (ويكيميديا — غير لإشعار)",
    originalFileName: "Beautiful_adhan.ogg",
    sourcePlatform: "wikimedia",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Beautiful_adhan.ogg",
    licenseType: "CC0-1.0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    attributionRequired: false,
    attributionText: "شكر اختياري: Adam-synagda عبر Wikimedia Commons — File:Beautiful_adhan.ogg (CC0).",
    commercialUseAllowed: true,
    appEmbeddingAllowed: true,
    standaloneDistributionAllowed: false,
    notificationCompatible: false,
    inAppPlaybackCompatible: false,
    approvedForProduction: false,
    status: "license_verified",
    verificationNotes: "CC0 موثّق؛ المدة ~154ث — أذان كامل اختياري لاحقًا بعد فحص الجودة؛ ليس صوت إشعار.",
    celebrityNameRisk: false,
    fileChecksum: "35fe06b08fe80505c550c33fed8a783fa9901ddc81ac884958b4be048f5b2a79",
    processedDurationSec: 154,
    evidencePath: "docs/audio-rights/evidence/wikimedia-beautiful-adhan-2026-09-13.html",
  },
];

export function getAudioRightsRecord(audioId: string): AudioRightsRecord | undefined {
  return PRAYER_AUDIO_RIGHTS_REGISTRY.find((r) => r.audioId === audioId);
}

export function listProductionApprovedAudio(): AudioRightsRecord[] {
  return PRAYER_AUDIO_RIGHTS_REGISTRY.filter(
    (r) => r.approvedForProduction && r.licenseType !== "rights_uncertain" && r.status !== "rejected",
  );
}

export function listAttributionRequiredAudio(): AudioRightsRecord[] {
  return PRAYER_AUDIO_RIGHTS_REGISTRY.filter((r) => r.attributionRequired && r.licenseType !== "rights_uncertain");
}

export function assertNoCelebrityProductionAudio(records = PRAYER_AUDIO_RIGHTS_REGISTRY): void {
  for (const r of records) {
    if (r.celebrityNameRisk && r.approvedForProduction) {
      throw new Error(`صوت إنتاجي يحمل خطر اسم مشهور: ${r.audioId}`);
    }
  }
}

export function isCatalogIdAllowedInProductionUi(audioId: string): boolean {
  if (audioId === "qatami") return false;
  const rec = getAudioRightsRecord(audioId);
  if (!rec) return false;
  return rec.approvedForProduction && !rec.celebrityNameRisk && rec.status !== "rejected";
}
