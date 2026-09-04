/**
 * بوابة: أول دخول لا يعرض خطأ إنترنت كاذب أثناء التحميل.
 * Run: node --import tsx src/lib/__tests__/boot-load-failure-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  classifyLoadFailure,
  messageForLoadFailure,
  userMessageFromLoadError,
} from "../load-failure";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

assert.equal(classifyLoadFailure(Object.assign(new Error("x"), { name: "RequestTimeoutError" })), "timeout");
assert.equal(classifyLoadFailure(new Error("404 not found")), "not_found");
assert.equal(classifyLoadFailure(new Error("HTTP 502 Bad Gateway")), "server");
assert.match(messageForLoadFailure("timeout"), /أطول من المعتاد|أعد المحاولة/);
assert.match(messageForLoadFailure("offline"), /غير متصل/);
assert.doesNotMatch(messageForLoadFailure("timeout"), /الاتصال بالإنترنت/);
assert.doesNotMatch(messageForLoadFailure("unknown"), /الاتصال بالإنترنت/);
assert.doesNotMatch(userMessageFromLoadError(new Error("Failed to fetch")), /الاتصال بالإنترنت/);

const asyncView = read("src/components/AsyncDataView.tsx");
assert.match(asyncView, /status === "loading"/);
assert.doesNotMatch(asyncView, /تحقّق من الاتصال ثم اضغط/);
assert.match(asyncView, /status === "loading".*Skeleton|if \(status === "loading"\) return <Skeleton/s);

const guard = read("src/components/PageLoadingGuard.tsx");
assert.match(guard, /showSkeleton|useDeferredLoading/);
assert.match(guard, /أطول من المعتاد|غير متصل بالإنترنت/);
assert.doesNotMatch(guard, /انتهت مهلة التحميل\. تحقق من الاتصال/);

const safeLoad = read("src/lib/safe-load.ts");
assert.match(safeLoad, /silentRetry|userMessageFromLoadError/);
assert.match(safeLoad, /runOnce/);

const useAsync = read("src/hooks/use-async-data.ts");
assert.match(useAsync, /userMessageFromLoadError/);
assert.match(useAsync, /إعادة محاولة صامتة/);

const req = read("src/lib/request-manager.ts");
assert.match(req, /PAGE_LOAD_TIMEOUT_MS\s*=\s*20000/);
assert.match(req, /REQUEST_TIMEOUT_MS\s*=\s*12000/);

const native = read("public/native-load-error.html");
assert.match(native, /جاري تجهيز الصفحة/);
assert.match(native, /mj\.native-load-retry/);
assert.match(native, /attempts < 2/);
assert.match(native, /الصفحة الرئيسية/);
assert.match(native, /https:\/\/www\.ssunnah\.com\//);
assert.doesNotMatch(native, /paintFinal\(\);\s*\n\s*\} else \{\s*\n\s*paintSoft/);
assert.match(native, /Cache-Control.*no-store/s);
assert.match(native, /is-loading/);

const sw = read("public/sw.js");
assert.match(sw, /native-load-error/);
assert.match(sw, /لا تُخدم\/تُخزَّن صفحة الخطأ|native-load-error/);

const cap = read("capacitor.config.ts");
assert.match(cap, /url:\s*"https:\/\/www\.ssunnah\.com"/);
assert.match(cap, /errorPath:\s*"native-load-error\.html"/);

const topic = read("src/components/topic/TopicPage.tsx");
assert.match(topic, /status === "loading"/);
assert.match(topic, /topic-page__skeleton/);
assert.doesNotMatch(topic, /تحقق من الاتصال بالإنترنت/);

console.log("boot-load-failure-gate: ok");
