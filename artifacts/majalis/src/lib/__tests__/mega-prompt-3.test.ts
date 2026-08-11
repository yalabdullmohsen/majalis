import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseExplainSections } from "../ai-ayah-explain";
import { searchQuranTopics, QURAN_MOOD_CHIPS } from "../quran-topics-index";
import { resolveReciterForQuality } from "../audio-quality-pref";

describe("mega-prompt-3 foundations", () => {
  it("parses structured AI ayah explain sections", () => {
    const sections = parseExplainSections(`
## المعنى الإجمالي
معنى موجز للآية.

## أسباب النزول / السياق
لا يُعرف سبب نزول خاص هنا.

## الفوائد والأحكام المستفادة
فائدة أولى.
`);
    assert.match(sections.overall, /معنى موجز/);
    assert.match(sections.context, /سبب/);
    assert.match(sections.takeaways, /فائدة/);
  });

  it("maps emotional mood queries to Quran topics", () => {
    const sad = searchQuranTopics("أشعر بالحزن");
    assert.ok(sad.length > 0);
    assert.equal(sad[0]?.topicId, "sabr");

    const rizq = searchQuranTopics("الرزق والبركة");
    assert.ok(rizq.some((h) => h.topicId === "rizq"));

    assert.ok(QURAN_MOOD_CHIPS.length >= 3);
  });

  it("resolves reciter for 64kbps quality preference", () => {
    const id = resolveReciterForQuality("alafasy", "64");
    assert.ok(typeof id === "string" && id.length > 0);
  });
});
