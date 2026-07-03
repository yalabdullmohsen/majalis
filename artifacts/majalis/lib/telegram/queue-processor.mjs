/**
 * Telegram Extraction Queue Processor
 * Picks pending raw messages, runs AI extraction, stores results, deduplicates.
 */
import { getSupabaseAdmin, isMissingTableError } from "../supabase-admin.mjs";
import { extractLessonFromText, computeQualityScore, buildContentHash } from "./extraction-engine.mjs";
import { getTelegramFileUrl } from "./channel-monitor.mjs";

const MAX_ATTEMPTS = 3;

export async function processExtractionQueue({ batchSize = 5 } = {}) {
  const admin = getSupabaseAdmin();
  if (!admin) return { processed: 0, skipped: 0 };

  if (!process.env.ANTHROPIC_API_KEY) {
    return { processed: 0, skipped: 0, error: "ANTHROPIC_API_KEY not configured" };
  }

  // Fetch pending messages
  let messages;
  try {
    const { data, error } = await admin
      .from("tg_raw_messages")
      .select("*")
      .eq("extraction_status", "pending")
      .lt("extraction_attempts", MAX_ATTEMPTS)
      .order("message_date", { ascending: true })
      .limit(batchSize);
    if (error) throw error;
    messages = data || [];
  } catch (err) {
    if (isMissingTableError(err)) return { processed: 0, skipped: 0, error: "tables_missing" };
    return { processed: 0, skipped: 0, error: err.message };
  }

  let processed = 0;
  let skipped = 0;

  for (const msg of messages) {
    // Mark as processing
    await admin.from("tg_raw_messages").update({
      extraction_status: "processing",
      extraction_attempts: (msg.extraction_attempts || 0) + 1,
      last_attempt_at: new Date().toISOString(),
    }).eq("id", msg.id);

    const text = [msg.raw_text, msg.raw_caption].filter(Boolean).join("\n\n");

    // Skip if no text content
    if (!text.trim()) {
      await admin.from("tg_raw_messages").update({ extraction_status: "skipped" }).eq("id", msg.id);
      skipped++;
      continue;
    }

    try {
      // AI extraction
      const result = await extractLessonFromText(msg.raw_text, msg.raw_caption);

      if (!result.ok) {
        const attempts = (msg.extraction_attempts || 0) + 1;
        await admin.from("tg_raw_messages").update({
          extraction_status: attempts >= MAX_ATTEMPTS ? "failed" : "pending",
        }).eq("id", msg.id);
        continue;
      }

      const extracted = result.data;

      // Quality score
      const { score, status, reason } = computeQualityScore(extracted);

      // Deduplication check
      const hash = buildContentHash(extracted);
      let isDuplicateOf = null;

      if (hash) {
        const { data: existingHash } = await admin.from("tg_dedup_hashes")
          .select("extracted_lesson_id")
          .eq("hash", hash)
          .single()
          .catch(() => ({ data: null }));

        if (existingHash?.extracted_lesson_id) {
          isDuplicateOf = existingHash.extracted_lesson_id;
        }
      }

      // Get best photo URL (highest resolution)
      let imageUrl = null;
      if (msg.photo_file_ids?.length > 0) {
        const bestPhotoId = msg.photo_file_ids[msg.photo_file_ids.length - 1];
        imageUrl = await getTelegramFileUrl(bestPhotoId);
      }

      // Auto-link sheikh by exact name match (DB lookup only — no AI guessing)
      let speakerId = null;
      if (extracted.sheikh_name) {
        const normalizedName = extracted.sheikh_name.replace(/^(الشيخ|الدكتور|د\.|أ\.د\.)\s+/u, "").trim();
        const { data: sheikhMatch } = await admin
          .from("sheikhs")
          .select("id")
          .or(`name.ilike.${normalizedName},name.ilike.${extracted.sheikh_name}`)
          .limit(1)
          .maybeSingle()
          .catch(() => ({ data: null }));
        if (sheikhMatch?.id) speakerId = sheikhMatch.id;
      }

      // Save extracted lesson
      const lessonData = {
        raw_message_id: msg.id,
        channel_id: msg.channel_id,
        title: extracted.title || null,
        sheikh_name: extracted.sheikh_name || null,
        speaker_id: speakerId,
        category: extracted.category || null,
        event_date: extracted.event_date || null,
        event_day: extracted.event_day || null,
        event_time: extracted.event_time || null,
        timezone: extracted.timezone || "Asia/Kuwait",
        mosque: extracted.mosque || null,
        area: extracted.area || null,
        city: extracted.city || null,
        governorate: extracted.governorate || null,
        country: extracted.country || "الكويت",
        stream_url: extracted.stream_url || null,
        location_url: extracted.location_url || null,
        contact: extracted.contact || null,
        organizer: extracted.organizer || null,
        co_organizer: extracted.co_organizer || null,
        has_womens_section: extracted.has_womens_section ?? null,
        description: extracted.description || null,
        image_url: imageUrl,
        quality_score: score,
        quality_status: isDuplicateOf ? "duplicate" : status,
        quality_reason: isDuplicateOf ? "تكرار لدرس موجود" : reason,
        confidence_scores: extracted.confidence_scores || {},
        ai_model: result.model,
        ai_prompt_tokens: result.promptTokens,
        ai_completion_tokens: result.completionTokens,
        review_status: isDuplicateOf ? "rejected" : "pending",
        is_duplicate_of: isDuplicateOf,
      };

      const { data: lesson, error: lessonError } = await admin
        .from("tg_extracted_lessons")
        .insert(lessonData)
        .select("id")
        .single();

      if (lessonError) throw lessonError;

      // Save dedup hash
      if (hash && !isDuplicateOf) {
        await admin.from("tg_dedup_hashes").upsert(
          { extracted_lesson_id: lesson.id, hash, hash_type: "content" },
          { onConflict: "hash", ignoreDuplicates: true },
        ).catch(() => {});
      }

      // Update raw message status
      await admin.from("tg_raw_messages").update({ extraction_status: "done" }).eq("id", msg.id);

      // Update channel stats
      if (msg.channel_id) {
        if (isDuplicateOf) {
          await admin.rpc("increment_channel_duplicates", { channel_uuid: msg.channel_id }).catch(() => {});
        } else {
          await admin.rpc("increment_channel_lessons", { channel_uuid: msg.channel_id }).catch(() => {});
        }
      }

      processed++;
    } catch (err) {
      console.error("[queue-processor] extraction failed:", msg.id, err.message);
      const attempts = (msg.extraction_attempts || 0) + 1;
      await admin.from("tg_raw_messages").update({
        extraction_status: attempts >= MAX_ATTEMPTS ? "failed" : "pending",
      }).eq("id", msg.id).catch(() => {});
    }
  }

  return { processed, skipped, total: messages.length };
}
