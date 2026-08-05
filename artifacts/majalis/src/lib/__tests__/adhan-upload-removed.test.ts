/**
 * بوابة: رفع الأذان ملغى نهائيًا — لا submit/publish/UI للرفع.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

const service = read("src/lib/user-submissions-service.ts");
assert.doesNotMatch(service, /export async function submitAdhan/, "no submitAdhan");
assert.doesNotMatch(service, /export async function publishAdhanToLibrary/, "no publishAdhanToLibrary");
assert.doesNotMatch(service, /export async function loadCommunityMuezzins/, "no loadCommunityMuezzins");
assert.match(service, /export async function submitLesson/, "lesson upload remains");
assert.match(service, /رفع الأذان أُلغي/, "cancellation documented");
console.log("  ✓ service: adhan upload roots removed");

const upload = read("src/views/UploadPage.tsx");
assert.doesNotMatch(upload, /submitAdhan|AdhanForm|رفع أذان/, "UploadPage has no adhan form");
assert.match(upload, /submitLesson/, "UploadPage still submits lessons");
assert.match(upload, /رفع درس/, "UploadPage is lesson-focused");
console.log("  ✓ UploadPage: adhan tab/form gone");

const adhanSettings = read("src/views/AdhanSettingsPage.tsx");
assert.doesNotMatch(adhanSettings, /ارفع أذانك|\/upload/, "no upload CTA on adhan settings");
console.log("  ✓ AdhanSettingsPage: upload link removed");

const admin = read("src/components/admin/SubmissionsReviewPanel.tsx");
assert.doesNotMatch(admin, /publishAdhanToLibrary/, "admin cannot publish adhan");
assert.match(admin, /ميزة رفع الأذان ملغاة/, "admin shows cancelled notice");
console.log("  ✓ SubmissionsReviewPanel: publish adhan removed");

const mine = read("src/views/MySubmissionsPage.tsx");
assert.doesNotMatch(mine, /ارفع أذاناً|رفع أذان أو درس|مكتبة المؤذنين/, "my-submissions CTAs cleaned");
console.log("  ✓ MySubmissionsPage: adhan CTAs cleaned");

console.log("\nadhan-upload-removed: all checks passed");
