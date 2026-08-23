const CARD_TYPES = new Set(["درس", "حلقة", "دورة", "خطبة", "تسجيل", "إعلان"]);
const AUDIENCES = new Set(["عام", "رجال", "نساء", "نشء"]);

export function validateFeedCard(card, index = 0) {
  const errors = [];
  if (!card || typeof card !== "object") {
    errors.push(`[${index}] ليس كائناً`);
    return errors;
  }
  for (const key of [
    "id",
    "type",
    "title_ar",
    "summary_ar",
    "sheikh",
    "place",
    "audience",
    "starts_at",
    "time_text",
    "register_url",
    "sources",
    "image_url",
    "published_at",
    "confidence",
  ]) {
    if (!(key in card)) errors.push(`[${index}] حقل مفقود: ${key}`);
  }
  if (!CARD_TYPES.has(card.type)) errors.push(`[${index}] نوع غير معروف: ${card.type}`);
  if (!AUDIENCES.has(card.audience)) errors.push(`[${index}] جمهور غير معروف: ${card.audience}`);
  if (!Array.isArray(card.sources) || card.sources.length === 0) {
    errors.push(`[${index}] sources فارغ`);
  } else {
    for (const [si, src] of card.sources.entries()) {
      for (const sk of ["id", "name_ar", "url", "post_url", "platform"]) {
        if (!src?.[sk]) errors.push(`[${index}] sources[${si}].${sk} مفقود`);
      }
    }
  }
  if (!card.title_ar?.trim()) errors.push(`[${index}] title_ar فارغ`);
  if (!card.published_at) errors.push(`[${index}] published_at فارغ`);
  if (typeof card.confidence !== "number") errors.push(`[${index}] confidence ليس رقماً`);
  return errors;
}

export function validateFeedDocument(doc) {
  const errors = [];
  if (!doc || typeof doc !== "object") return ["المستند غير صالح"];
  if (!Array.isArray(doc.items)) errors.push("items ليس مصفوفة");
  if (!doc.generated_at) errors.push("generated_at مفقود");
  for (const [i, item] of (doc.items ?? []).entries()) {
    errors.push(...validateFeedCard(item, i));
  }
  return errors;
}

export function assertValidFeed(doc) {
  const errors = validateFeedDocument(doc);
  if (errors.length) {
    const msg = `feed schema invalid:\n${errors.slice(0, 20).join("\n")}`;
    throw new Error(msg);
  }
}
