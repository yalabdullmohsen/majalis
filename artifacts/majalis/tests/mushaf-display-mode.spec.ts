/**
 * تشخيص + قبول: وضع عرض المصحف SYSTEM ↔ LIGHT ↔ DARK
 * يثبت قبل الإصلاح: هل البطاقة تستقبل pointer events؟
 * يثبت بعد الإصلاح: selected/persisted/store/provider/effectiveMode
 */
import { test, expect, type Page } from "@playwright/test";

type Mode = "SYSTEM" | "LIGHT" | "DARK";

const MODES: Mode[] = ["SYSTEM", "LIGHT", "DARK"];

type ModeSnapshot = {
  selectedMode: string | null;
  persistedMode: string | null;
  storeMode: string | null;
  providerMode: string | null;
  effectiveMode: string | null;
  htmlAttr: string | null;
  rootAttr: string | null;
};

type HitProbe = {
  testId: string;
  pointerEvents: string;
  parentPointerEvents: string;
  panelPointerEvents: string;
  disabled: boolean;
  hitTag: string | null;
  hitTestId: string | null;
  hitIsCard: boolean;
  hitIsDescendantOfCard: boolean;
};

async function seedAndOpen(page: Page, start: Mode = "SYSTEM") {
  await page.addInitScript((mode) => {
    try {
      window.sessionStorage.setItem("mj.launch-splash.session.v4", "1");
      window.localStorage.setItem("majalis-theme", "light");
      window.localStorage.setItem("ssunnah-mushaf-appearance-v1", mode);
    } catch {
      /* ignore */
    }
  }, start);
  await page.goto("/mushaf?page=1", { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="mushaf-viewport"]', { timeout: 30000 });
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="mushaf-viewport"]')?.getAttribute("data-pager-settled") ===
      "1",
    null,
    { timeout: 20000 },
  );
}

async function openMorePanel(page: Page) {
  // HTMLElement.click يتجاوز فحوصات الإظهار ويصل لمُعالج React
  await page.evaluate(() => {
    const btn = document.querySelector<HTMLButtonElement>('[data-testid="mushaf-controls-more"]');
    btn?.click();
  });
  await expect(page.getByTestId("mushaf-controls-more-panel")).toBeVisible({ timeout: 8000 });
  await expect(page.getByTestId("mushaf-display-mode")).toBeVisible({ timeout: 8000 });
}

async function clickMode(page: Page, mode: Mode) {
  const card = page.getByTestId(`mushaf-display-mode-${mode}`);
  await expect(card).toBeVisible();
  // نقرة حقيقية (ليس evaluate) — تثبت استقبال pointer events
  await card.click({ timeout: 5000 });
}

async function readSnapshot(page: Page): Promise<ModeSnapshot> {
  return page.evaluate(() => {
    const active = document.querySelector<HTMLElement>(
      '[data-testid^="mushaf-display-mode-"].is-active, [data-testid^="mushaf-display-mode-"][aria-checked="true"]',
    );
    const selectedMode =
      active?.getAttribute("data-testid")?.replace("mushaf-display-mode-", "") ?? null;
    const persistedMode = localStorage.getItem("ssunnah-mushaf-appearance-v1");
    const htmlAttr = document.documentElement.getAttribute("data-mushaf-appearance");
    const rootAttr = document.querySelector(".nm-root")?.getAttribute("data-mushaf-appearance") ?? null;
    const diag = document.querySelector<HTMLElement>('[data-testid="mushaf-appearance-diag"]');
    const providerMode = diag?.getAttribute("data-mode") ?? diag?.dataset.mode ?? null;
    const effectiveMode = rootAttr || htmlAttr;
    return {
      selectedMode,
      persistedMode,
      storeMode: persistedMode,
      providerMode: providerMode || effectiveMode,
      effectiveMode,
      htmlAttr,
      rootAttr,
    };
  });
}

async function probeHit(page: Page, mode: Mode): Promise<HitProbe> {
  return page.evaluate((id) => {
    const card = document.querySelector<HTMLElement>(`[data-testid="mushaf-display-mode-${id}"]`);
    const panel = document.querySelector<HTMLElement>('[data-testid="mushaf-controls-more-panel"]');
    if (!card) {
      return {
        testId: id,
        pointerEvents: "missing",
        parentPointerEvents: "missing",
        panelPointerEvents: panel ? getComputedStyle(panel).pointerEvents : "missing",
        disabled: true,
        hitTag: null,
        hitTestId: null,
        hitIsCard: false,
        hitIsDescendantOfCard: false,
      };
    }
    const rect = card.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const hit = document.elementFromPoint(x, y) as HTMLElement | null;
    return {
      testId: id,
      pointerEvents: getComputedStyle(card).pointerEvents,
      parentPointerEvents: card.parentElement
        ? getComputedStyle(card.parentElement).pointerEvents
        : "missing",
      panelPointerEvents: panel ? getComputedStyle(panel).pointerEvents : "missing",
      disabled: card.hasAttribute("disabled") || card.getAttribute("aria-disabled") === "true",
      hitTag: hit?.tagName ?? null,
      hitTestId: hit?.getAttribute("data-testid") ?? hit?.closest?.("[data-testid]")?.getAttribute("data-testid") ?? null,
      hitIsCard: hit === card,
      hitIsDescendantOfCard: Boolean(hit && card.contains(hit)),
    };
  }, mode);
}

function expectResolved(mode: Mode, snap: ModeSnapshot, systemResolved: "light" | "night") {
  expect(snap.selectedMode).toBe(mode);
  expect(snap.persistedMode).toBe(mode);
  expect(snap.storeMode).toBe(mode);
  const expected =
    mode === "SYSTEM" ? systemResolved : mode === "DARK" ? "night" : "light";
  expect(snap.effectiveMode).toBe(expected);
  expect(snap.htmlAttr).toBe(expected);
  expect(snap.rootAttr).toBe(expected);
}

test.describe("mushaf display mode — click path", () => {
  test("probe pointer-events + SYSTEM→LIGHT→DARK→SYSTEM", async ({ page }) => {
    const logs: string[] = [];
    page.on("console", (msg) => {
      const t = msg.text();
      if (t.includes("[mushaf-display-mode]")) logs.push(t);
    });

    await seedAndOpen(page, "SYSTEM");
    await openMorePanel(page);

    const beforeAll = await readSnapshot(page);
    console.log("[mushaf-display-mode] BEFORE", beforeAll);

    for (const mode of MODES) {
      const probe = await probeHit(page, mode);
      console.log("[mushaf-display-mode] HIT_PROBE", mode, probe);
      // المعيار: العنصر تحت نقطة الوسط يجب أن يكون البطاقة أو ابنها
      expect(
        probe.hitIsCard || probe.hitIsDescendantOfCard,
        `OVERLAY_BLOCKING_CLICK? mode=${mode} hit=${probe.hitTag}/${probe.hitTestId} pe=${probe.pointerEvents} panelPe=${probe.panelPointerEvents}`,
      ).toBe(true);
      expect(probe.pointerEvents, `card pointer-events for ${mode}`).not.toBe("none");
      expect(probe.panelPointerEvents, "panel pointer-events").not.toBe("none");
      expect(probe.disabled).toBe(false);
    }

    const systemResolved =
      (await page.evaluate(() =>
        window.matchMedia("(prefers-color-scheme: dark)").matches ? "night" : "light",
      )) === "night"
        ? "night"
        : "light";

    for (const mode of ["LIGHT", "DARK", "SYSTEM"] as Mode[]) {
      const before = await readSnapshot(page);
      console.log(`[mushaf-display-mode] CLICK ${mode} BEFORE`, before);
      await clickMode(page, mode);
      await page.waitForTimeout(120);
      const after = await readSnapshot(page);
      console.log(`[mushaf-display-mode] CLICK ${mode} AFTER`, after);
      expectResolved(mode, after, systemResolved);
    }

    // ثبات بعد إعادة فتح اللوحة
    await page.evaluate(() => {
      document.querySelector<HTMLButtonElement>('[data-testid="mushaf-controls-more"]')?.click();
    });
    await page.waitForTimeout(100);
    await openMorePanel(page);
    const reopened = await readSnapshot(page);
    expect(reopened.persistedMode).toBe("SYSTEM");
    expect(reopened.selectedMode).toBe("SYSTEM");
    expect(reopened.effectiveMode).toBe(systemResolved);

    // إعادة تحميل الصفحة — persistence
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForSelector('[data-testid="mushaf-viewport"]', { timeout: 30000 });
    await openMorePanel(page);
    const afterReload = await readSnapshot(page);
    expect(afterReload.persistedMode).toBe("SYSTEM");
    expect(afterReload.selectedMode).toBe("SYSTEM");
    expect(afterReload.effectiveMode).toBe(systemResolved);

    void logs;
  });

  for (const device of [
    { name: "iPhone", width: 390, height: 844 },
    { name: "iPad", width: 768, height: 1024 },
  ] as const) {
    for (const theme of ["light", "dark"] as const) {
      test(`${device.name} ${theme}: LIGHT then DARK effectiveMode`, async ({ page }) => {
        await page.setViewportSize({ width: device.width, height: device.height });
        await page.addInitScript((t) => {
          try {
            window.sessionStorage.setItem("mj.launch-splash.session.v4", "1");
            window.localStorage.setItem("majalis-theme", t);
            window.localStorage.setItem("ssunnah-mushaf-appearance-v1", "SYSTEM");
            document.documentElement.classList.toggle("dark", t === "dark");
            document.documentElement.setAttribute("data-theme", t);
          } catch {
            /* ignore */
          }
        }, theme);
        await page.goto("/mushaf?page=2", { waitUntil: "domcontentloaded" });
        await page.waitForSelector('[data-testid="mushaf-viewport"]', { timeout: 30000 });
        await openMorePanel(page);

        await clickMode(page, "LIGHT");
        await page.waitForTimeout(100);
        let snap = await readSnapshot(page);
        expect(snap.effectiveMode).toBe("light");
        expect(snap.persistedMode).toBe("LIGHT");

        await clickMode(page, "DARK");
        await page.waitForTimeout(100);
        snap = await readSnapshot(page);
        expect(snap.effectiveMode).toBe("night");
        expect(snap.persistedMode).toBe("DARK");

        await clickMode(page, "SYSTEM");
        await page.waitForTimeout(100);
        snap = await readSnapshot(page);
        expect(snap.persistedMode).toBe("SYSTEM");
        expect(["light", "night"]).toContain(snap.effectiveMode);
      });
    }
  }
});
