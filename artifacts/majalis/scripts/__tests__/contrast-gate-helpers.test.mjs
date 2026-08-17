import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertionSelectors,
  loadContrastBaseline,
  violationKey,
} from "../verify-color-contrast-gate.mjs";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

describe("contrast gate helpers", () => {
  it("splits dual selectors on || without lowering the threshold", () => {
    const sels = assertionSelectors({
      selector: ".section-lobby .card--featured .card__label || .pts-hero__name",
    });
    assert.deepEqual(sels, [
      ".section-lobby .card--featured .card__label",
      ".pts-hero__name",
    ]);
  });

  it("keeps a single selector unchanged", () => {
    assert.deepEqual(assertionSelectors({ selector: ".pts-dates" }), [".pts-dates"]);
  });

  it("baseline file exists and is empty (no permanent exceptions)", () => {
    const file = resolve(appRoot, "docs/contrast-baseline.json");
    assert.equal(existsSync(file), true);
    const raw = JSON.parse(readFileSync(file, "utf8"));
    assert.equal(Array.isArray(raw.violations), true);
    assert.equal(raw.violations.length, 0);
    const loaded = loadContrastBaseline();
    assert.equal(loaded.listed, 0);
    assert.equal(loaded.known.size, 0);
  });

  it("violation keys include path, mode, and selector", () => {
    assert.equal(
      violationKey({ path: "/prayer-times", mode: "dark", selector: ".pts-hero__name" }),
      "/prayer-times|dark|.pts-hero__name",
    );
  });
});
