/**
 * recitation-settings-service.ts
 * حفظ/تحميل آخر إعدادات المستخدم لاختبار التسميع (القسم 1: "احفظ آخر
 * إعدادات المستخدم واستخدمها افتراضيًا في الجلسة التالية"). يستخدم جدول
 * recitation_settings القائم فعلاً (supabase/quran_recitation_ai_test_v1.sql)
 * — لم يكن له أي خدمة تقرأ/تكتب منه قبل هذا الملف.
 *
 * مستخدمون بلا حساب (زوار): لا حفظ عبر الأجهزة، لكن التفضيلات تبقى
 * سارية داخل الجلسة نفسها في حالة React المحلية — لا خطأ ولا انهيار،
 * فقط بلا استمرارية عبر الزيارات (متوقَّع ومقبول لزائر مجهول).
 */
import { supabase } from "@/lib/supabase";
import type { AlertLevel, PrecisionLevel, RecitationMode } from "./types";

export type RecitationSettings = {
  defaultMode: RecitationMode;
  precisionLevel: PrecisionLevel;
  alertLevel: AlertLevel;
  hintStyle: "progressive" | "off";
  revealGranularity: "word" | "ayah" | "page";
  saveRecordings: boolean;
  showErrorCount: boolean;
};

export const DEFAULT_RECITATION_SETTINGS: RecitationSettings = {
  defaultMode: "interactive_mushaf",
  precisionLevel: "hifz",
  alertLevel: "gentle",
  hintStyle: "progressive",
  revealGranularity: "word",
  saveRecordings: false,
  showErrorCount: true,
};

export async function loadRecitationSettings(userId: string): Promise<RecitationSettings> {
  const { data } = await supabase
    .from("recitation_settings")
    .select("default_mode,precision_level,alert_level,hint_style,reveal_granularity,save_recordings,show_error_count")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return DEFAULT_RECITATION_SETTINGS;

  return {
    defaultMode: (data.default_mode as RecitationMode) ?? DEFAULT_RECITATION_SETTINGS.defaultMode,
    precisionLevel: (data.precision_level as PrecisionLevel) ?? DEFAULT_RECITATION_SETTINGS.precisionLevel,
    alertLevel: (data.alert_level as AlertLevel) ?? DEFAULT_RECITATION_SETTINGS.alertLevel,
    hintStyle: (data.hint_style as "progressive" | "off") ?? DEFAULT_RECITATION_SETTINGS.hintStyle,
    revealGranularity: (data.reveal_granularity as "word" | "ayah" | "page") ?? DEFAULT_RECITATION_SETTINGS.revealGranularity,
    saveRecordings: data.save_recordings ?? false,
    showErrorCount: data.show_error_count ?? true,
  };
}

export async function saveRecitationSettings(userId: string, settings: RecitationSettings): Promise<void> {
  await supabase.from("recitation_settings").upsert(
    {
      user_id: userId,
      default_mode: settings.defaultMode,
      precision_level: settings.precisionLevel,
      alert_level: settings.alertLevel,
      hint_style: settings.hintStyle,
      reveal_granularity: settings.revealGranularity,
      save_recordings: settings.saveRecordings,
      show_error_count: settings.showErrorCount,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
}
