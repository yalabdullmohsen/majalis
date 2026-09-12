/**
 * بوابة مراجعة بيانات القرآن المرجعية.
 * - تتحقق من بصمة quran-v2 مقابل SOURCE.json
 * - أي تعديل على الملفات المرجعية دون موافقة صريحة → QuranDataReviewRequired
 *
 * تشغيل: node --import tsx src/lib/__tests__/quran-data-review-gate.test.ts
 *
 * موافقة صريحة عند تغيير البيانات:
 *   QURAN_DATA_REVIEW_APPROVED=1
 * أو ملف موافقة في نفس الـ PR:
 *   docs/quran-data-reviews/APPROVED.json
 *   { "status": "QuranDataReviewApproved", "reviewer": "...", "reason": "...", "ticket": "..." }
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { checkQuranV2Fingerprint } from "@/lib/quran-data/quran-data-fingerprint";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const monorepoRoot = resolve(root, "../..");

const PROTECTED_PATH_RE =
  /(^|\/)(public\/data\/quran-v2\/|public\/data\/quran\/|public\/fonts\/qpc-v2\/)/;

const APPROVAL_REL = "docs/quran-data-reviews/APPROVED.json";

function listChangedPaths(): string[] {
  const envList = process.env.QURAN_DATA_CHANGED_PATHS?.trim();
  if (envList) {
    return envList
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const ranges = ["origin/main...HEAD", "main...HEAD", "HEAD~1...HEAD"];
  for (const range of ranges) {
    try {
      const out = execSync(`git diff --name-only ${range}`, {
        cwd: monorepoRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      });
      return out
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
    } catch {
      /* try next */
    }
  }
  return [];
}

function hasExplicitApproval(changed: string[]): boolean {
  if (process.env.QURAN_DATA_REVIEW_APPROVED === "1") return true;

  const approvalPath = resolve(root, APPROVAL_REL);
  if (!existsSync(approvalPath)) return false;

  try {
    const raw = JSON.parse(readFileSync(approvalPath, "utf8")) as {
      status?: string;
      reviewer?: string;
      reason?: string;
    };
    if (raw.status !== "QuranDataReviewApproved") return false;
    if (!raw.reviewer?.trim() || !raw.reason?.trim()) return false;
    const approvalTouched = changed.some(
      (p) => p.endsWith(APPROVAL_REL) || p.includes("quran-data-reviews/APPROVED.json"),
    );
    // محليًا يكفي الملف الصحيح؛ في CI يجب أن يظهر ضمن diff التغييرات
    if (process.env.CI === "true") return approvalTouched;
    return true;
  } catch {
    return false;
  }
}

const fp = checkQuranV2Fingerprint();
assert.equal(
  fp.status,
  "ok",
  `QuranDataReviewRequired — بصمة غير متطابقة:\n${(fp.mismatches ?? []).join("\n")}`,
);
assert.ok(fp.ok, "fingerprint must be ok");
assert.equal(fp.pageCount, 604);
assert.equal(fp.actual.ayahCount, 6236);
assert.equal(fp.actual.wordCount, 83665);

const changed = listChangedPaths();
const protectedHits = changed.filter((p) => PROTECTED_PATH_RE.test(p));

if (protectedHits.length > 0) {
  assert.ok(
    hasExplicitApproval(changed),
    [
      "QuranDataReviewRequired",
      "تم تعديل ملفات قرآن مرجعية دون موافقة صريحة:",
      ...protectedHits.map((p) => `  - ${p}`),
      "المطلوب: QURAN_DATA_REVIEW_APPROVED=1 أو docs/quran-data-reviews/APPROVED.json",
      "مع reviewer + reason + status=QuranDataReviewApproved في نفس الـ PR.",
    ].join("\n"),
  );
}

console.log(
  `quran-data-review-gate.test.ts: ok (pages=${fp.pageCount}, protectedChanges=${protectedHits.length})`,
);
