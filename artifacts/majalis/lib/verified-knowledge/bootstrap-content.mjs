/**
 * Bootstrap verified adhkar/hadith content from local seeds into Supabase.
 */

import { loadSeedCorpus } from "../scholarly-verification/seed-scanner.mjs";
import { runVerifiedKnowledgeGate } from "./verification-gate.mjs";
import { VERIFICATION_STATUS } from "./constants.mjs";
import { parseAdhkarFromSeedFile, parseArbaeenFromSeedFile } from "./seed-parsers.mjs";

async function upsertProvenance(admin, contentType, contentId, gate, defaults = {}) {
  if (!admin) return null;
  const p = gate.provenance;
  try {
    const row = {
      content_type: contentType,
      content_id: contentId,
      source_name: p.source_name ?? defaults.source_name,
      source_url: p.source_url ?? defaults.source_url,
      source_type: p.source_type ?? "official",
      trust_level: gate.trust_level,
      verification_status: gate.verification_status,
      quality_score: gate.quality_score,
      completeness_score: gate.completeness_score,
      metadata: {
        confidence_score: gate.confidence_score,
        requires_human_review: gate.requires_human_review,
      },
      updated_at: new Date().toISOString(),
    };
    const { data } = await admin
      .from("content_provenance")
      .upsert(row, { onConflict: "content_type,content_id" })
      .select("id")
      .maybeSingle();
    return data?.id ?? null;
  } catch {
    return null;
  }
}

export async function bootstrapVerifiedContent(admin, opts = {}) {
  const { categories, items: adhkarItems } = parseAdhkarFromSeedFile();
  const hadithItems = parseArbaeenFromSeedFile();
  const corpus = loadSeedCorpus();

  const result = {
    discovered: categories.length + adhkarItems.length + hadithItems.length + corpus.length,
    imported: 0,
    updated: 0,
    rejected: 0,
    needs_review: 0,
    samples: [],
    sections: {},
    errors: [],
  };

  if (opts.dryRun) {
    result.sections = {
      adhkar_categories: categories.length,
      adhkar_items: adhkarItems.length,
      hadith_items: hadithItems.length,
      corpus_items: corpus.length,
    };
    return result;
  }

  if (!admin) {
    result.errors.push("Supabase admin not configured");
    return result;
  }

  for (const cat of categories) {
    try {
      await admin.from("verified_adhkar_categories").upsert({
        id: cat.id,
        slug: cat.slug,
        name: cat.name,
        description: cat.description,
        source_slug: "hisn-muslim",
        verification_status: VERIFICATION_STATUS.VERIFIED,
        trust_level: 95,
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });
      result.imported += 1;
    } catch (err) {
      result.errors.push(`category:${cat.id}:${err.message}`);
    }
  }

  for (const item of adhkarItems) {
    try {
      const gate = await runVerifiedKnowledgeGate(
        {
          title: item.text.slice(0, 80),
          text: item.text,
          category: item.category_id,
          source_url: item.source_url,
          source_name: item.source_name ?? "حصn المسلم",
          trust_level: 95,
        },
        { checkLinks: false },
      );

      const status = gate.can_auto_publish ? VERIFICATION_STATUS.VERIFIED : VERIFICATION_STATUS.NEEDS_REVIEW;
      if (status === VERIFICATION_STATUS.NEEDS_REVIEW) result.needs_review += 1;
      if (status === VERIFICATION_STATUS.REJECTED) result.rejected += 1;

      const provenanceId = opts.persistProvenance !== false
        ? await upsertProvenance(admin, "adhkar", item.id, gate)
        : null;

      await admin.from("verified_adhkar_items").upsert({
        id: item.id,
        category_id: item.category_id,
        text: item.text,
        repeat_count: item.repeat_count,
        narrator: item.narrator,
        source_name: item.source_name,
        source_url: item.source_url,
        grade: item.grade,
        reference: item.reference,
        keywords: item.keywords,
        provenance_id: provenanceId,
        verification_status: status,
        quality_score: gate.quality_score,
        trust_level: gate.trust_level,
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });

      result.imported += 1;
      result.samples.push({ content_type: "adhkar", content_id: item.id, item: { text: item.text, source_url: item.source_url } });
    } catch (err) {
      result.errors.push(`adhkar:${item.id}:${err.message}`);
    }
  }

  for (const item of hadithItems) {
    try {
      const gate = await runVerifiedKnowledgeGate(
        {
          title: item.title,
          text: item.text,
          category: item.chapter,
          source_url: item.source_url,
          source_name: item.source_name,
          trust_level: 95,
        },
        { checkLinks: false },
      );

      const status = gate.can_auto_publish ? VERIFICATION_STATUS.VERIFIED : VERIFICATION_STATUS.NEEDS_REVIEW;
      if (status === VERIFICATION_STATUS.NEEDS_REVIEW) result.needs_review += 1;

      const provenanceId = opts.persistProvenance !== false
        ? await upsertProvenance(admin, "hadith", item.id, gate)
        : null;

      await admin.from("verified_hadith_items").upsert({
        ...item,
        provenance_id: provenanceId,
        verification_status: status,
        quality_score: gate.quality_score,
        trust_level: gate.trust_level,
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });

      result.imported += 1;
      result.samples.push({ content_type: "hadith", content_id: item.id, item });
    } catch (err) {
      result.errors.push(`hadith:${item.id}:${err.message}`);
    }
  }

  result.sections = {
    adhkar_categories: categories.length,
    adhkar_items: adhkarItems.length,
    hadith_items: hadithItems.length,
    corpus_items: corpus.length,
  };

  return result;
}

export { parseAdhkarFromSeedFile, parseArbaeenFromSeedFile } from "./seed-parsers.mjs";
