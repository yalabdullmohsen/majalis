/**
 * AudioSource + مفتاح التعطيل المركزي.
 * تشغيل: npx tsx src/lib/__tests__/quran-audio-source.test.ts
 */
import assert from "node:assert/strict";
import {
  RECITERS,
  getSelectableReciters,
  getAyahAudioUrl,
  getSurahAudioUrl,
  listAyahAudioUrls,
  VALID_PLAYBACK_RATES,
} from "../quran-audio";
import {
  audioSourceUrlQueue,
  canResolveAudioSource,
  resolveAudioSource,
} from "../quran-audio-source";
import { __setQuranAudioRemoteConfigForTests } from "../quran-audio-remote-config";

__setQuranAudioRemoteConfigForTests(null);

const requiredIds = [
  "dosari",
  "ali_jaber",
  "abdulsamad",
  "minshawi",
  "husary",
  "alafasy",
  "ghamdi",
  "maher",
  "sudais",
  "shuraim",
  "ajamy",
  "qatami",
  "shatri",
  "balilah",
  "jaleel",
  "abkar",
  "fares",
  "rifai",
];
for (const id of requiredIds) {
  assert.ok(RECITERS.some((r) => r.id === id), `قارئ مطلوب: ${id}`);
}

assert.equal(RECITERS.find((r) => r.id === "balilah")?.everyayahFolder, null);
assert.equal(RECITERS.find((r) => r.id === "jaleel")?.everyayahFolder, null);
assert.equal(RECITERS.find((r) => r.id === "abkar")?.everyayahFolder, null);

const ayahList = getSelectableReciters("ayah");
assert.ok(ayahList.every((r) => r.everyayahFolder), "منتقي الآية بلا قرّاء سورة-فقط");
assert.ok(!ayahList.some((r) => r.id === "balilah"), "بندر بليلة لا يظهر في آية-بآية");

const surahList = getSelectableReciters("surah");
assert.ok(surahList.some((r) => r.id === "balilah"));
assert.ok(surahList.some((r) => r.id === "jaleel"));
assert.ok(surahList.some((r) => r.id === "abkar"));

const ayah = resolveAudioSource({ kind: "ayah", surah: 1, ayah: 1, reciterId: "alafasy" });
assert.ok(ayah);
assert.equal(ayah!.source, "everyayah");
assert.match(ayah!.primary, /Alafasy_128kbps/);
assert.ok(audioSourceUrlQueue({ kind: "ayah", surah: 1, ayah: 1, reciterId: "alafasy" }).length >= 1);

assert.equal(
  canResolveAudioSource({ kind: "ayah", surah: 1, ayah: 1, reciterId: "balilah" }),
  false,
);
assert.ok(canResolveAudioSource({ kind: "surah", surah: 1, reciterId: "balilah" }));
assert.match(getSurahAudioUrl(1, "balilah"), /balilah\/001\.mp3$/);
assert.equal(getAyahAudioUrl(1, 1, "balilah"), "");

const husaryUrls = listAyahAudioUrls(1, 1, "husary");
assert.ok(husaryUrls.length >= 2, "احتياط عفاسي بعد القارئ الأساسي");
assert.match(husaryUrls[0]!, /Husary/);
assert.match(husaryUrls[1]!, /Alafasy/);
assert.deepEqual(listAyahAudioUrls(1, 1, "alafasy"), [getAyahAudioUrl(1, 1, "alafasy")]);
assert.deepEqual(
  listAyahAudioUrls(1, 1, "balilah"),
  [getAyahAudioUrl(1, 1, "alafasy")],
  "قارئ سورة-فقط: احتياط عفاسي للآية",
);

__setQuranAudioRemoteConfigForTests({
  disabledReciterIds: ["alafasy"],
  disabledSources: [],
});
assert.ok(!getSelectableReciters("ayah").some((r) => r.id === "alafasy"));
assert.equal(getAyahAudioUrl(1, 1, "alafasy"), "");

__setQuranAudioRemoteConfigForTests({
  disabledReciterIds: [],
  disabledSources: ["everyayah"],
});
assert.equal(getSelectableReciters("ayah").length, 0);
assert.ok(getSelectableReciters("surah").length > 0);

__setQuranAudioRemoteConfigForTests(null);

assert.deepEqual([...VALID_PLAYBACK_RATES], [0.75, 1, 1.25, 1.5, 1.75, 2]);

for (const r of RECITERS) {
  assert.ok(r.riwaya.trim().length > 0, `رواية: ${r.id}`);
  assert.ok(r.qualityLabel.trim().length > 0, `جودة: ${r.id}`);
  assert.ok(r.nameAr.trim().length > 0, `اسم: ${r.id}`);
}

console.log("quran-audio-source.test.ts: ok");
