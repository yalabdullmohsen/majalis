import { useCallback, useState } from "react";
import { Link } from "wouter";
import { invalidateLessonsCache } from "@/lib/lessons-service";
import {
  EMPTY_PARSED,
  approveLessonImportFromUrl,
  extractLessonFromUrl,
  rejectLessonImportFromUrl,
  reExtractLessonFromUrl,
  saveLessonImportFromUrl,
  type DebugLog,
  type ParsedLessonFields,
  type LessonImportResponse,
} from "@/lib/lesson-import-api";
import { Loading } from "@/components/ui-common";
import { AdminShell, useAdminShell } from "@/views/admin/AdminShell";
import { LessonImportReviewPanel, labelStyle } from "@/views/admin/LessonImportShared";

const PLATFORM_HINTS = [
  "Instagram — instagram.com/p/...",
  "X — x.com/.../status/...",
  "YouTube — youtube.com/watch?v=...",
  "Telegram — t.me/channel/123",
  "صفحة ويب — أي رابط HTTPS",
];

function LessonImportUrlContent() {
  const { showSuccess, showError } = useAdminShell();
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [visionEnabled, setVisionEnabled] = useState<boolean | null>(null);
  const [visionMessage, setVisionMessage] = useState("");
  const [draftId, setDraftId] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [parsed, setParsed] = useState<ParsedLessonFields>({ ...EMPTY_PARSED });
  const [confidence, setConfidence] = useState(0);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<{ field: string; message: string }[]>([]);
  const [fieldConfidence, setFieldConfidence] = useState<Record<string, number>>({});
  const [failureReasons, setFailureReasons] = useState<Record<string, string>>({});
  const [debugLog, setDebugLog] = useState<DebugLog | null>(null);
  const [sheikhHint, setSheikhHint] = useState("");
  const [platformLabel, setPlatformLabel] = useState("");
  const [duplicateMessage, setDuplicateMessage] = useState("");

  const applyResponse = useCallback((res: LessonImportResponse) => {
    if (res.vision_enabled != null) setVisionEnabled(res.vision_enabled);
    if (res.message) setVisionMessage(res.message);
    if (res.draft_id) setDraftId(res.draft_id);
    if (res.image_url != null) setImageUrl(res.image_url || null);
    if (res.source_url) setSourceUrl(String(res.source_url));
    if (res.extracted_text != null) setExtractedText(res.extracted_text);
    if (res.parsed_fields) setParsed({ ...EMPTY_PARSED, ...res.parsed_fields });
    if (res.confidence_score != null) setConfidence(res.confidence_score);
    if (res.missing_fields) setMissingFields(res.missing_fields);
    if (res.warnings) setWarnings(res.warnings as { field: string; message: string }[]);
    if (res.field_confidence) setFieldConfidence(res.field_confidence);
    if (res.failure_reasons) setFailureReasons(res.failure_reasons);
    if (res.debug_log !== undefined) setDebugLog(res.debug_log ?? null);
    if (res.platform_label) setPlatformLabel(String(res.platform_label));
    const dup = res.duplicate as { isDuplicate?: boolean; draft?: { status?: string }; lesson?: { title?: string } } | undefined;
    if (dup?.isDuplicate) {
      if (dup.lesson?.title) setDuplicateMessage(`رابط مكرر — درس: ${dup.lesson.title}`);
      else if (dup.draft?.status) setDuplicateMessage(`رابط مكرر — مسودة (${dup.draft.status})`);
      else setDuplicateMessage("رابط مكرر");
    } else {
      setDuplicateMessage("");
    }
    const match = res.suggested_sheikh_match;
    if (match?.matched?.name) setSheikhHint(`مطابقة: ${match.matched.name}`);
    else if (match?.proposed?.name) setSheikhHint(`سيُنشأ شيخ مسودة: ${match.proposed.name}`);
    else setSheikhHint("");
  }, []);

  const onImport = async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      showError("أدخل رابط الإعلان");
      return;
    }
    setBusy(true);
    try {
      const res = await extractLessonFromUrl(trimmed, notes.trim() || undefined);
      if (!res.ok) {
        showError(res.message || res.error || "تعذر استيراد الرابط");
        return;
      }
      applyResponse(res);
      if (res.extraction_failed || res.partial) {
        showSuccess("تعذر الاستخراج الكامل — أكمل البيانات يدويًا");
      } else if (res.vision_enabled === false) {
        showSuccess("تم جلب الرابط — أكمل البيانات يدويًا");
      } else {
        showSuccess("تم استخراج البيانات — راجعها ثم اعتمد");
      }
    } catch {
      showError("تعذر استيراد الرابط");
    } finally {
      setBusy(false);
    }
  };

  const onSaveDraft = async () => {
    setBusy(true);
    try {
      const res = await saveLessonImportFromUrl(parsed, {
        draftId: draftId || undefined,
        sourceUrl: sourceUrl || url.trim() || undefined,
        imageUrl: imageUrl || undefined,
        extractedText,
        notes: notes.trim() || undefined,
      });
      if (!res.ok) {
        showError(res.error || "تعذر حفظ المسودة");
        return;
      }
      if (res.draft_id) setDraftId(res.draft_id);
      showSuccess("تم حفظ المسودة");
    } catch {
      showError("تعذر حفظ المسودة");
    } finally {
      setBusy(false);
    }
  };

  const onApprove = async () => {
    if (!draftId) {
      showError("لا توجد مسودة — استورد الرابط أولًا");
      return;
    }
    setBusy(true);
    try {
      const res = await approveLessonImportFromUrl(draftId, parsed);
      if (!res.ok) {
        const msgs = res.validation?.errors?.map((e) => e.message).join(" — ");
        showError(msgs || res.error || "تعذر الاعتماد");
        return;
      }
      invalidateLessonsCache();
      showSuccess("تم اعتماد الدرس — يظهر الآن في المنصة");
      setDraftId(null);
      setImageUrl(null);
      setSourceUrl(null);
      setExtractedText("");
      setParsed({ ...EMPTY_PARSED });
      setUrl("");
    } catch {
      showError("تعذر الاعتماد");
    } finally {
      setBusy(false);
    }
  };

  const onReject = async () => {
    if (!draftId) return;
    setBusy(true);
    try {
      await rejectLessonImportFromUrl(draftId);
      showSuccess("تم رفض المسودة");
      setDraftId(null);
      setParsed({ ...EMPTY_PARSED });
    } catch {
      showError("تعذر الرفض");
    } finally {
      setBusy(false);
    }
  };

  const onReExtract = async () => {
    if (!draftId) return;
    setBusy(true);
    try {
      const res = await reExtractLessonFromUrl(draftId);
      if (!res.ok) {
        showError(res.message || res.error || "تعذر إعادة الاستخراج");
        return;
      }
      applyResponse(res);
      showSuccess("تم إعادة الاستخراج من الرابط");
    } catch {
      showError("تعذر إعادة الاستخراج");
    } finally {
      setBusy(false);
    }
  };

  const hasDraft = Boolean(draftId || sourceUrl || parsed.title);

  return (
    <div>
      <div className="liu-header">
        <div>
          <h2 className="liu-title">إضافة درس من رابط</h2>
          <p className="liu-desc">
            الصق رابط الإعلان → استخراج تلقائي → مراجعة → اعتماد → نشر في المنصة.
          </p>
        </div>
        <div className="liu-nav-links">
          <Link href="/admin/content-import/image" className="liu-nav-link">من صورة</Link>
          <Link href="/admin" className="liu-nav-link">← لوحة الإدارة</Link>
        </div>
      </div>

      {(visionEnabled === false || visionMessage) && (
        <div className="liu-vision-notice">
          {visionMessage || "الاستخراج التلقائي غير مفعّل. يمكنك إدخال البيانات يدويًا."}
        </div>
      )}

      <section className="liu-section">
        <h3 className="liu-section__h3">1. رابط الإعلان</h3>
        <label style={labelStyle}>URL</label>
        <input
          className="adm-input liu-input--mb"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          dir="ltr"
          disabled={busy}
        />
        <label style={labelStyle}>ملاحظات (اختياري)</label>
        <input className="adm-input liu-input--mb" value={notes} onChange={(e) => setNotes(e.target.value)} disabled={busy} />
        <button
          type="button"
          disabled={busy}
          onClick={onImport}
          className="liu-import-btn"
        >
          {busy ? "جاري الاستيراد…" : "استيراد من الرابط"}
        </button>
        <ul className="liu-hints">
          {PLATFORM_HINTS.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      </section>

      {hasDraft && (
        <LessonImportReviewPanel
          parsed={parsed}
          onParsedChange={setParsed}
          busy={busy}
          draftId={draftId}
          imageUrl={imageUrl}
          sourceUrl={sourceUrl || url.trim()}
          extractedText={extractedText}
          confidence={confidence}
          missingFields={missingFields}
          warnings={warnings}
          sheikhHint={sheikhHint}
          platformLabel={platformLabel}
          duplicateMessage={duplicateMessage}
          fieldConfidence={fieldConfidence}
          failureReasons={failureReasons}
          debugLog={debugLog}
          onApprove={onApprove}
          onSaveDraft={onSaveDraft}
          onReject={onReject}
          onReExtract={onReExtract}
          reExtractLabel="إعادة جلب الرابط"
        />
      )}

      {busy && (
        <div className="liu-loading-wrap">
          <Loading />
        </div>
      )}
    </div>
  );
}

export default function LessonImportUrlPage() {
  return (
    <AdminShell section="lessons" onSectionChange={() => {}}>
      <LessonImportUrlContent />
    </AdminShell>
  );
}

export { LessonImportUrlContent };
