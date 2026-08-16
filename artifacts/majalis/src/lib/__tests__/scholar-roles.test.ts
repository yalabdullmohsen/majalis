/**
 * اختبارات اشتقاق دور العالم ومستوى التنبيه.
 * node --import tsx src/lib/__tests__/scholar-roles.test.ts
 */
import assert from "node:assert/strict";
import {
  inferScholarCautionLevel,
  inferScholarRoleType,
} from "../scholar-roles.ts";
import type { Scholar } from "../scholars-data.ts";

function base(partial: Partial<Scholar>): Scholar {
  return {
    id: "t",
    name: "اختبار",
    fullName: "اختبار",
    era: "المحدثون",
    specialty: ["حديث"],
    bio: "نبذة",
    key_works: [],
    died: "١ هـ",
    region: "—",
    verificationStatus: "reviewed",
    sources: ["سير أعلام النبلاء"],
    ...partial,
  };
}

assert.equal(inferScholarRoleType(base({ specialty: ["فقه", "أصول"] })), "فقيه");
assert.equal(inferScholarRoleType(base({ specialty: ["حديث", "رجال"] })), "محدث");
assert.equal(inferScholarRoleType(base({ specialty: ["تفسير"] })), "مفسر");
assert.equal(inferScholarRoleType(base({ era: "المعاصرون", specialty: ["فقه"] })), "معاصر");
assert.equal(inferScholarCautionLevel(base({ sources: [] })), "review");
assert.equal(
  inferScholarCautionLevel(base({ specialty: ["فلسفة"], sources: ["مرجع"] })),
  "context",
);

console.log("scholar-roles.test.ts: ok");
