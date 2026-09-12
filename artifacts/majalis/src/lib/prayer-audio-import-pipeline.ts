/**
 * خط أنابيب استيراد أصوات الصلاة — اكتشاف → تحقق ترخيص → جودة → اعتماد.
 * لا ينشر للإنتاج دون license_verified + approvedForProduction.
 */

export type ImportPipelineStage =
  | "discover"
  | "open_source_page"
  | "read_license"
  | "save_evidence"
  | "download_original"
  | "hash"
  | "validate_ownership"
  | "validate_audio"
  | "dedupe"
  | "classify"
  | "process"
  | "attribution"
  | "test"
  | "approve"
  | "publish"
  | "rejected";

export type ImportCandidate = {
  candidateId: string;
  sourceUrl: string;
  sourcePlatform: "cc0-pack" | "wikimedia" | "pixabay" | "freesound" | "public-domain" | "other";
  displayNameAr: string;
  licenseClaim: string;
  stage: ImportPipelineStage;
  licenseVerified: boolean;
  approvedForProduction: boolean;
  rejectionReason?: string;
  celebrityNameRisk: boolean;
  evidencePath?: string;
  originalChecksum?: string;
};

const BLOCKED_NAME_MARKERS = [
  "الدوسري",
  "المعيقلي",
  "الشريم",
  "بليلة",
  "العجمي",
  "أبكر",
  "الحرم المكي",
  "الحرم المدني",
  "ناصر القطامي",
  "العفاسي",
];

export function detectCelebrityNameRisk(text: string): boolean {
  return BLOCKED_NAME_MARKERS.some((m) => text.includes(m));
}

export function evaluateImportCandidate(input: Omit<ImportCandidate, "stage" | "licenseVerified" | "approvedForProduction"> & {
  hasLicenseEvidence: boolean;
  licenseAllowsAppEmbedding: boolean;
  audioQualityOk: boolean;
  isDuplicate: boolean;
}): ImportCandidate {
  const celebrityNameRisk = input.celebrityNameRisk || detectCelebrityNameRisk(input.displayNameAr);
  if (celebrityNameRisk) {
    return {
      ...input,
      stage: "rejected",
      licenseVerified: false,
      approvedForProduction: false,
      celebrityNameRisk: true,
      rejectionReason: "اسم/نسبة لمؤذن أو جهة مشهورة بلا إثبات حقوق.",
    };
  }
  if (!input.hasLicenseEvidence) {
    return {
      ...input,
      stage: "rejected",
      licenseVerified: false,
      approvedForProduction: false,
      rejectionReason: "لا يوجد دليل ترخيص محفوظ لصفحة الأصل.",
    };
  }
  if (!input.licenseAllowsAppEmbedding) {
    return {
      ...input,
      stage: "rejected",
      licenseVerified: true,
      approvedForProduction: false,
      rejectionReason: "الترخيص لا يسمح بالتضمين داخل التطبيق.",
    };
  }
  if (!input.audioQualityOk) {
    return {
      ...input,
      stage: "rejected",
      licenseVerified: true,
      approvedForProduction: false,
      rejectionReason: "فشل فحص جودة الصوت.",
    };
  }
  if (input.isDuplicate) {
    return {
      ...input,
      stage: "rejected",
      licenseVerified: true,
      approvedForProduction: false,
      rejectionReason: "تكرار صوتي — احتُفظ بالنسخة الأعلى جودة.",
    };
  }
  return {
    ...input,
    stage: "approve",
    licenseVerified: true,
    approvedForProduction: true,
    celebrityNameRisk: false,
  };
}

export const IMPORT_PIPELINE_ORDER: ImportPipelineStage[] = [
  "discover",
  "open_source_page",
  "read_license",
  "save_evidence",
  "download_original",
  "hash",
  "validate_ownership",
  "validate_audio",
  "dedupe",
  "classify",
  "process",
  "attribution",
  "test",
  "approve",
  "publish",
];
