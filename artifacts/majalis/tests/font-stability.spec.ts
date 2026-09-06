/**
 * ثبات خط الواجهة: لا قفزة مقاس/وزن/التفاف بعد document.fonts.ready.
 * يقيس بعد استقرار المحتوى (لا خلط مع تحميل البطاقات)، ثم بعد fonts.ready + 3ث.
 */
import { test, expect, type Page } from "@playwright/test";
import { waitForContent } from "./helpers";

const ROUTES = [
  {
    path: "/lessons",
    titleSel: "h1, .page-hero-mj__title, .page-hero-mj__headline",
    cardSel: ".hub-card__title, .lesson-card__title, [data-testid='lesson-card'] .title, .soft-card h3, .soft-card h2",
  },
  {
    path: "/fiqh",
    titleSel: "h1, .page-hero-mj__title, .fqh-hub-hero__title",
    cardSel: ".fqh-hub-card__title, .fiqh-book-card__title, .hub-card__title, .soft-card h3",
  },
  {
    path: "/quran-hub",
    titleSel: "h1, .page-hero-mj__title, .page-hero-mj__headline",
    cardSel: ".hub-card__title, .soft-card h3, .soft-card h2, main h2, main h3",
  },
] as const;

test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
});

type Metrics = {
  titleH: number;
  titleW: number;
  cardH: number;
  cardW: number;
  family: string;
  weight: string;
  titleText: string;
  cardText: string;
};

async function dismissSplash(page: Page) {
  await page.evaluate(() => {
    const splash = document.getElementById("mj-launch-splash");
    if (splash) {
      splash.classList.add("mj-launch-splash--out");
      splash.setAttribute("hidden", "");
      (splash as HTMLElement).style.display = "none";
    }
    document.documentElement.classList.remove("app-booting");
    document.documentElement.dataset.appBooting = "0";
  });
}

async function waitForStableUi(page: Page, titleSel: string, cardSel: string) {
  await page.waitForFunction(
    ({ titleSel: tSel, cardSel: cSel }) => {
      const splash = document.getElementById("mj-launch-splash");
      const splashGone =
        !splash ||
        splash.hasAttribute("hidden") ||
        splash.classList.contains("mj-launch-splash--out") ||
        getComputedStyle(splash).display === "none";
      const pick = (sel: string) => {
        for (const node of document.querySelectorAll(sel)) {
          const el = node as HTMLElement;
          const r = el.getBoundingClientRect();
          const t = (el.innerText || "").trim();
          if (r.height > 8 && r.width > 8 && t.length > 1) return el;
        }
        return null;
      };
      return splashGone && Boolean(pick(tSel) || pick("h1, h2")) && Boolean(pick(cSel) || pick("h1, h2"));
    },
    { titleSel, cardSel },
    { timeout: 25_000 },
  );
  // إطاران بعد الاستقرار حتى لا نلتقط منتصف إعادة التخطيط بسبب البيانات
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      }),
  );
}

async function readMetrics(page: Page, titleSel: string, cardSel: string): Promise<Metrics | null> {
  return page.evaluate(
    ({ titleSel: tSel, cardSel: cSel }) => {
      const pick = (sel: string) => {
        for (const node of document.querySelectorAll(sel)) {
          const el = node as HTMLElement;
          const r = el.getBoundingClientRect();
          const t = (el.innerText || "").trim();
          if (r.height > 8 && r.width > 8 && t.length > 1) return el;
        }
        return null;
      };
      const title = pick(tSel) || pick("h1, h2");
      const card = pick(cSel) || title;
      if (!title || !card) return null;
      const tr = title.getBoundingClientRect();
      const cr = card.getBoundingClientRect();
      const cs = getComputedStyle(title);
      return {
        titleH: Math.round(tr.height * 100) / 100,
        titleW: Math.round(tr.width * 100) / 100,
        cardH: Math.round(cr.height * 100) / 100,
        cardW: Math.round(cr.width * 100) / 100,
        family: cs.fontFamily,
        weight: cs.fontWeight,
        titleText: (title.innerText || "").trim().slice(0, 60),
        cardText: (card.innerText || "").trim().slice(0, 60),
      };
    },
    { titleSel, cardSel },
  );
}

for (const route of ROUTES) {
  test(`font stability — ${route.path}`, async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("majalis-theme", "light");
      window.localStorage.setItem("majlis_intro_seen", "1");
      window.localStorage.setItem("majalis-intro-seen", "1");
      window.sessionStorage.setItem("mj.launch-splash.session.v2", "1");
    });

    await page.goto(route.path, { waitUntil: "domcontentloaded" });
    await waitForContent(page);
    await dismissSplash(page);
    await waitForStableUi(page, route.titleSel, route.cardSel);

    const before = await readMetrics(page, route.titleSel, route.cardSel);
    expect(before, `يجب وجود عنوان/بطاقة على ${route.path}`).not.toBeNull();

    await page.evaluate(async () => {
      if (document.fonts?.ready) await document.fonts.ready;
    });
    await page.waitForTimeout(3000);

    const after = await readMetrics(page, route.titleSel, route.cardSel);
    expect(after).not.toBeNull();

    const b = before!;
    const a = after!;

    // نفس العناصر النصية — إن تغيّر المحتوى (lazy) نتخطّى مقارنة المقاس ونفحص الخط فقط
    expect(a.family.toLowerCase()).toContain("amiri");
    expect(a.weight, `وزن الخط تغيّر على ${route.path}`).toBe(b.weight);

    if (a.titleText === b.titleText) {
      expect(Math.abs(a.titleH - b.titleH), `ارتفاع العنوان تغيّر على ${route.path}`).toBeLessThanOrEqual(2);
      expect(Math.abs(a.titleW - b.titleW), `عرض العنوان تغيّر على ${route.path}`).toBeLessThanOrEqual(6);
    }
    if (a.cardText === b.cardText && b.cardH > 0) {
      expect(Math.abs(a.cardH - b.cardH), `ارتفاع بطاقة الدرس/العنصر تغيّر على ${route.path}`).toBeLessThanOrEqual(3);
      expect(Math.abs(a.cardW - b.cardW), `عرض البطاقة تغيّر على ${route.path}`).toBeLessThanOrEqual(6);
    }
  });
}
