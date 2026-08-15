/**
 * كتالوج الأذان — أنماط + نسبة متحفّظة + مفتاح تعطيل.
 * تشغيل: node --import tsx src/lib/__tests__/adhan-catalog.test.ts
 */
import assert from "node:assert/strict";
import {
  ADHAN_PATTERNS,
  type AdhanPatternId,
} from "../adhan-patterns";
import {
  DEFAULT_MUEZZIN_ID,
  MUEZZINS,
  getMuezzin,
  hasFajrAdhan,
  isMuezzinSelectable,
  listSelectableMuezzins,
} from "../adhan-audio";
import { __setAdhanAudioRemoteConfigForTests } from "../adhan-audio-remote-config";

const REQUIRED: AdhanPatternId[] = [
  "makki",
  "madani",
  "aqsa",
  "egyptian",
  "levantine",
  "turkish",
];

assert.deepEqual(
  ADHAN_PATTERNS.map((p) => p.id).sort(),
  [...REQUIRED].sort(),
  "الأنماط الستة معرّفة",
);

for (const id of REQUIRED) {
  assert.ok(
    MUEZZINS.some((m) => m.patternId === id),
    `نمط ${id} له إدخال واحد على الأقل`,
  );
}

for (const m of MUEZZINS) {
  if (m.attribution === "style_only") {
    assert.equal(m.personName, null, `${m.id}: style_only بلا personName`);
  }
  if (m.personName) {
    assert.equal(
      m.attribution,
      "verified",
      `${m.id}: اسم شخصي يتطلب attribution=verified`,
    );
  }
  if (m.audioAvailable) {
    assert.ok(
      m.audioUrl.startsWith("https://") ||
        m.audioUrl.startsWith("/sounds/") ||
        m.audioUrl.startsWith("/audio/"),
      `${m.id}: رابط صوت محلي أو CDN`,
    );
  } else {
    assert.equal(m.audioUrl, "", `${m.id}: بلا صوت → url فارغ`);
    assert.equal(isMuezzinSelectable(m), false, `${m.id}: غير قابل للاختيار`);
  }
  assert.ok(m.licenseNote.length > 0, `${m.id}: ملاحظة ترخيص`);
  assert.ok(m.sourceId, `${m.id}: مصدر`);
}

const selectable = listSelectableMuezzins();
assert.ok(selectable.length >= 3, "تسجيلات قابلة للاختيار");
assert.ok(
  selectable.every((m) => m.audioAvailable && m.audioUrl),
  "المختارون لديهم صوت",
);

const def = getMuezzin(DEFAULT_MUEZZIN_ID);
assert.equal(def.attribution, "style_only");
assert.equal(def.personName, null);
assert.ok(hasFajrAdhan(def), "الافتراضي له أذان فجر بالتثويب");

__setAdhanAudioRemoteConfigForTests({
  disabledRecordingIds: [DEFAULT_MUEZZIN_ID],
  disabledSources: [],
  disabledPatternIds: [],
});
assert.equal(
  isMuezzinSelectable(MUEZZINS.find((m) => m.id === DEFAULT_MUEZZIN_ID)!),
  false,
  "مفتاح التعطيل يخفي تسجيلاً",
);
assert.notEqual(getMuezzin(DEFAULT_MUEZZIN_ID).id, DEFAULT_MUEZZIN_ID);

__setAdhanAudioRemoteConfigForTests({
  disabledRecordingIds: [],
  disabledSources: ["mohsalvi-adhan-audio"],
  disabledPatternIds: [],
});
assert.equal(listSelectableMuezzins().length, 0, "تعطيل المصدر يخفي الكل");

__setAdhanAudioRemoteConfigForTests({
  disabledRecordingIds: [],
  disabledSources: [],
  disabledPatternIds: ["egyptian"],
});
assert.ok(
  listSelectableMuezzins().every((m) => m.patternId !== "egyptian"),
  "تعطيل النمط يخفي تسجيلاته",
);

__setAdhanAudioRemoteConfigForTests(null);

console.log("adhan-catalog.test.ts: ok");
