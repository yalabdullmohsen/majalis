#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const QA_BLOCK = `  /* ───────── جولة ٤٥: إثراء Q&A (505-524) ───────── */
  {
    "id": "seed-qa-505",
    "question": "ما حكم صلاة الجنازة على الميت؟",
    "answer": "الجواب: صلاة الجنازة فرض كفاية على المسلمين؛ إذا ص laها البعض سقط الإثm عن الباقين، وإن تركها أهل البلد أثموا جميعاً. وهي أربع تكبيرات بلا رukuوع ولا سجود، فيها الدعاء للميت والاستغفار. والأصل: «من مات منكم فصلّوا عليه» — رواه البخاري (1315) ومسلm (945).",
    "category_id": "seed-cat-salah",
    "ruling_type": "واجب",
    "evidence": "",
    "reference": "صحيح البخاري 1315؛ صحيح مسلm 945",
    "status": "published",
    "review_status": "approved",
    "created_at": "2024-05-12T13:00:00.000Z",
    "qa_categories": { "name": "الصلاة", "slug": "salah" },
    "trust_level": "primary_text",
    "editorial_review_status": "unreviewed",
    "last_updated_at": "2026-07-27T00:00:00.000Z"
  }
`;

// Fix the template above - I'll write proper Arabic in the script file directly
