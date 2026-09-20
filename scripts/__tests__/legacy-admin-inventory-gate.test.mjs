/**
 * بوابة PR-1: جرد Legacy Admin موجود ومكتمل العناوين قبل أي حذف/بناء v3.
 * تشغيل: node --test scripts/__tests__/legacy-admin-inventory-gate.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const invPath = resolve(root, "docs/admin/LEGACY_ADMIN_INVENTORY.md");

describe("legacy-admin-inventory", () => {
  it("inventory file exists", () => {
    assert.ok(existsSync(invPath), "docs/admin/LEGACY_ADMIN_INVENTORY.md مطلوب");
  });

  it("covers routes, sections, FABs, migration matrix, no-delete policy", () => {
    const md = readFileSync(invPath, "utf8");
    assert.match(md, /Legacy Admin Inventory/);
    assert.match(md, /\/admin/);
    assert.match(md, /AdminShell/);
    assert.match(md, /AdminSiteEditBar|مشرف/);
    assert.match(md, /review-hub/);
    assert.match(md, /Review Center/);
    assert.match(md, /Content Center|Content/);
    assert.match(md, /Automation/);
    assert.match(md, /PR-13/);
    assert.match(md, /لا حذف|لا يُحذف شيء في PR-1/);
    assert.match(md, /لا تعديل.*صلاحيات|لا تغيير صلاحيات|لا تعديل CRUD/);
    assert.match(md, /NAV_GROUPS|section=/);
    assert.doesNotMatch(md, /ISLAMIC_SECTS_SECTION_COMPLETE/);
  });
});
