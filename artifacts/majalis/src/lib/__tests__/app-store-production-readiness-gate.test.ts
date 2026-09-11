/**
 * بوابة جاهزية إنتاج App Store — خصوصية الميكروفون وتشخيص الإنتاج.
 * تشغيل: node --import tsx src/lib/__tests__/app-store-production-readiness-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const plugin = read("ios/App/App/MajlisPlaybackAudioPlugin.swift");
assert.doesNotMatch(plugin, /setCategory\(\s*\n?\s*\.playAndRecord/, "لا تفعيل playAndRecord في الإنتاج");
assert.match(plugin, /RECORDING_UNSUPPORTED/, "تسجيل الصوت مرفوض صراحة");
assert.doesNotMatch(plugin, /mode:\s*\.measurement/, "لا وضع قياس/تسجيل");

const privacy = read("ios/App/App/PrivacyInfo.xcprivacy");
assert.doesNotMatch(privacy, /NSPrivacyCollectedDataTypeAudioData/, "لا AudioData في Privacy Manifest");
assert.match(privacy, /NSPrivacyCollectedDataTypeCoarseLocation/, "الموقع التقريبي معلن");

const playback = read("src/lib/native-playback-audio.ts");
assert.doesNotMatch(playback, /plugin\.enableRecording\(\)/, "الجسر لا يستدعي enableRecording");

const notif = read("src/pages/account/ui/NotificationSettingsView.tsx");
assert.doesNotMatch(notif, /notifDebug\s*===\s*["']1["']/, "لا فتح تشخيص إشعارات عبر الاستعلام في الإنتاج");
assert.match(notif, /import\.meta\.env\.DEV/, "أدوات المطوّر محصورة بالتطوير");

const qibla = read("src/pages/worship/ui/QiblaView.tsx");
const picker = read("src/components/prayer/PrayerLocationPicker.tsx");
assert.match(qibla, /enableHighAccuracy:\s*false/, "القبلة بدون دقة عالية مضلّلة للبيان");
assert.match(picker, /enableHighAccuracy:\s*false/, "محدد الموقع بدون دقة عالية مضلّلة");

const checklist = read("store-assets/checklist-ar.md");
assert.match(checklist, /https:\/\/www\.ssunnah\.com\/privacy/, "رابط خصوصية الإنتاج");
assert.match(checklist, /https:\/\/www\.ssunnah\.com\/account-deletion/, "رابط حذف الحساب");

const doc = read("docs/APP_STORE_PRODUCTION_READINESS.md");
assert.match(doc, /READY WITH CONDITIONS|Feature Freeze|مصفوفة اختبار/, "وثيقة الإطلاق موجودة");

console.log("app-store-production-readiness-gate.test.ts: ok");
