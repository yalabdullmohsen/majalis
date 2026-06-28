/**
 * Smart Extraction Pipeline
 * Image → Preprocess → OCR → Rules → Confidence → Decision → AI (if needed) → Validate → Result
 */
import { emptyLessonPayload, buildMissingFields, normalizeExtractedPayload } from "../../cms/lesson-extractor-shared.mjs";
import { validateLessonDraft } from "../../cms/content-validator.mjs";
import { runSmartOcr } from "./smart-ocr.mjs";
import { runRuleEngine } from "./rule-engine.mjs";
import { computeConfidence } from "./confidence-engine.mjs";
import { shouldInvokeAi } from "./decision-engine.mjs";
import { invokeMultiProviderVision, invokeMultiProviderText } from "./multi-provider-ai.mjs";
import { validateExtractedFields } from "./validation-engine.mjs";
import { recordExtractionRun } from "./monitoring.mjs";

const MANUAL_MESSAGE =
  "تعذر الاستخراج التلقائي. تم حفظ الصورة — يمكنك إدخال البيانات يدوياً أو إعادة المحاولة لاحقاً.";

function mergeFields(ruleFields, aiFields) {
  const merged = { ...emptyLessonPayload(), ...ruleFields };
  for (const [k, v] of Object.entries(aiFields || {})) {
    if (v !== "" && v !== false && v != null && !(Array.isArray(v) && !v.length)) {
      if (!merged[k] || String(merged[k]).length < String(v).length) merged[k] = v;
    }
  }
  return merged;
}

export async function runSmartExtractionPipeline({
  imageBase64,
  mimeType = "image/jpeg",
  sourceUrl,
  notes,
  textOnly,
}) {
  const started = Date.now();
  const pipeline = [];

  if (textOnly) {
    pipeline.push("text_input");
    const ruleResult = runRuleEngine(textOnly, { source: sourceUrl });
    let fields = ruleResult.fields;
    let providerUsed = "rule_engine";
    let usedAi = false;

    const confidence = computeConfidence(fields, textOnly);
    const decision = shouldInvokeAi({
      ruleResult,
      confidence,
      ocrOk: true,
      ocrTextLength: textOnly.length,
      lineCount: textOnly.split(/\n/).length,
      urlCount: (textOnly.match(/https?:\/\//g) || []).length,
    });

    if (decision.invoke) {
      pipeline.push("ai_text");
      const ai = await invokeMultiProviderText({ text: textOnly, sourceUrl });
      if (ai.ok) {
        fields = mergeFields(fields, ai.parsed);
        providerUsed = ai.providerUsed;
        usedAi = true;
      } else {
        providerUsed = "manual_review";
      }
    }

    const finalConfidence = computeConfidence(fields, textOnly);
    fields.confidence = finalConfidence.overall;
    fields.confidence_reason = finalConfidence.confidence_reason;
    const validation = await validateExtractedFields(fields);
    const draftValidation = validateLessonDraft(fields);

    recordExtractionRun({
      ocrOk: true,
      usedAi,
      providerUsed,
      confidence: finalConfidence.overall,
      durationMs: Date.now() - started,
      publishAction: finalConfidence.publishAction,
    });

    return buildPipelineResult({
      fields,
      providerUsed,
      usedAi,
      pipeline,
      ocrText: textOnly,
      confidence: finalConfidence,
      validation,
      draftValidation,
      durationMs: Date.now() - started,
    });
  }

  pipeline.push("preprocess", "ocr");
  const ocr = await runSmartOcr({ imageBase64, mimeType, notes, sourceUrl });

  if (!ocr.ok && !notes) {
    pipeline.push("ocr_failed");
    const empty = emptyLessonPayload();
    recordExtractionRun({ ocrOk: false, usedAi: false, providerUsed: "manual_review", confidence: 0, durationMs: Date.now() - started });
    return buildPipelineResult({
      fields: empty,
      providerUsed: "manual_review",
      usedAi: false,
      pipeline,
      ocrText: "",
      confidence: { overall: 0, publishAction: "ai_or_manual" },
      validation: { ok: false, issues: [{ reason: "ocr_failed" }] },
      draftValidation: validateLessonDraft(empty),
      durationMs: Date.now() - started,
      userMessage: MANUAL_MESSAGE,
      manualReview: true,
    });
  }

  const ocrText = ocr.text || notes || "";
  pipeline.push("rule_engine");
  const ruleResult = runRuleEngine(ocrText, { source: sourceUrl, ...ocr.hints });
  let fields = ruleResult.fields;
  let providerUsed = "rule_engine";
  let usedAi = false;

  const confidence = computeConfidence(fields, ocrText);
  const decision = shouldInvokeAi({
    ruleResult,
    confidence,
    ocrOk: ocr.ok,
    ocrTextLength: ocrText.length,
    lineCount: ocr.features?.lineCount || 0,
    urlCount: ocr.features?.urlCount || 0,
  });

  pipeline.push(`decision:${decision.reason}`);

  if (decision.invoke && imageBase64) {
    pipeline.push("ai_vision");
    const ai = await invokeMultiProviderVision({ imageBase64, mimeType, ocrContext: ocrText });
    if (ai.ok) {
      fields = mergeFields(fields, ai.parsed);
      providerUsed = ai.providerUsed;
      usedAi = true;
    } else {
      providerUsed = "manual_review";
      pipeline.push("ai_failed");
    }
  } else if (decision.invoke && !imageBase64) {
    pipeline.push("ai_text");
    const ai = await invokeMultiProviderText({ text: ocrText, sourceUrl });
    if (ai.ok) {
      fields = mergeFields(fields, ai.parsed);
      providerUsed = ai.providerUsed;
      usedAi = true;
    }
  }

  fields.raw_ocr_text = ocrText;
  fields.source = usedAi ? `${providerUsed}+rules` : "rule_engine";

  const finalConfidence = computeConfidence(fields, ocrText);
  fields.confidence = finalConfidence.overall;
  fields.confidence_reason = finalConfidence.confidence_reason;

  pipeline.push("validation");
  const validation = await validateExtractedFields(fields);
  if (validation.rejected) {
    fields.status_note = "rejected_invalid_date";
  }

  const normalized = normalizeExtractedPayload(fields);
  const draftValidation = validateLessonDraft(normalized);

  recordExtractionRun({
    ocrOk: ocr.ok,
    usedAi,
    providerUsed,
    confidence: finalConfidence.overall,
    durationMs: Date.now() - started,
    publishAction: finalConfidence.publishAction,
  });

  return buildPipelineResult({
    fields: normalized,
    providerUsed,
    usedAi,
    pipeline,
    ocr,
    ocrText,
    confidence: finalConfidence,
    decision,
    validation,
    draftValidation,
    durationMs: Date.now() - started,
    manualReview: providerUsed === "manual_review" && finalConfidence.overall < 0.5,
    userMessage: providerUsed === "manual_review" ? MANUAL_MESSAGE : undefined,
  });
}

function buildPipelineResult(ctx) {
  const missing = buildMissingFields(ctx.fields);
  return {
    ok: ctx.providerUsed !== "manual_review" || ctx.confidence?.overall >= 0.5,
    providerUsed: ctx.providerUsed,
    usedAi: ctx.usedAi,
    pipeline: ctx.pipeline,
    parsed: ctx.fields,
    extractedText: ctx.ocrText || "",
    confidence: ctx.confidence?.overall ?? 0,
    confidenceDetail: ctx.confidence,
    publishAction: ctx.confidence?.publishAction || "full_review",
    validation: ctx.draftValidation,
    fieldValidation: ctx.validation,
    missing_fields: missing,
    warnings: [...(ctx.draftValidation?.warnings || []), ...(ctx.validation?.issues || [])],
    manualReview: ctx.manualReview || false,
    userMessage: ctx.userMessage,
    durationMs: ctx.durationMs,
    ocr: ctx.ocr,
    decision: ctx.decision,
  };
}
