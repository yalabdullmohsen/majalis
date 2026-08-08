/**
 * بوابة: خصائص Enter للبحث + تغطية الحقول الحرجة والجسر العام.
 * تشغيل: node --import tsx src/lib/__tests__/search-input-enter.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  handleSearchEnterKey,
  SEARCH_INPUT_ATTRS,
} from "../search-input.ts";

const SRC = join(dirname(fileURLToPath(import.meta.url)), "../..");

{
  assert.equal(SEARCH_INPUT_ATTRS.enterKeyHint, "search");
  assert.equal(SEARCH_INPUT_ATTRS.inputMode, "search");
  assert.equal(SEARCH_INPUT_ATTRS.type, "search");
}

{
  let blurred = false;
  let prevented = false;
  let searched = false;
  const fakeEvent = {
    key: "Enter",
    preventDefault() {
      prevented = true;
    },
    currentTarget: {
      blur() {
        blurred = true;
      },
    },
  } as unknown as Parameters<typeof handleSearchEnterKey>[0];
  handleSearchEnterKey(fakeEvent, { onSearch: () => { searched = true; } });
  assert.equal(prevented, true);
  assert.equal(blurred, true);
  assert.equal(searched, true);
}

{
  const bridge = readFileSync(join(SRC, "components/SearchKeyboardBridge.tsx"), "utf8");
  assert.match(bridge, /enterkeyhint/);
  assert.match(bridge, /blur\(\)/);
  assert.match(bridge, /focusin/);
}

{
  const critical = [
    "components/SearchSuggestions.tsx",
    "components/GlobalSearchModal.tsx",
    "components/quran/JumpPageModal.tsx",
    "components/ui/mj.tsx",
  ];
  for (const rel of critical) {
    const src = readFileSync(join(SRC, rel), "utf8");
    assert.match(src, /enterKeyHint=["']search["']/, `${rel} يجب أن يصرّح enterKeyHint=search`);
  }
}

{
  const app = readFileSync(join(SRC, "App.tsx"), "utf8");
  assert.match(app, /SearchKeyboardBridge/);
}

console.log("search-input-enter: ok");
