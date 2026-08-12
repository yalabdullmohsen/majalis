#!/usr/bin/env node
import { chromium, devices } from "playwright";

const base = process.argv.find((a) => a.startsWith("--base="))?.slice(7) || "http://127.0.0.1:4173";

async function exerciseMenu(page, label) {
  const menuBtn = page.locator(".navbar-menu-btn--drawer");
  await menuBtn.waitFor({ state: "visible", timeout: 15_000 });

  const box = await menuBtn.boundingBox();
  if (!box || box.width < 8 || box.height < 8) {
    throw new Error(`${label}: menu button has no clickable box`);
  }

  await menuBtn.click();
  const drawer = page.locator("#main-navigation-drawer");
  await drawer.waitFor({ state: "visible", timeout: 5_000 });

  await menuBtn.click();
  await drawer.waitFor({ state: "hidden", timeout: 5_000 });

  await menuBtn.click();
  await drawer.waitFor({ state: "visible", timeout: 5_000 });

  // Backdrop is full-screen; on narrow viewports the drawer covers the center — click the left strip.
  const backdrop = page.locator(".mobile-nav-backdrop").first();
  const backdropBox = await backdrop.boundingBox();
  if (!backdropBox) throw new Error(`${label}: backdrop missing`);
  await page.mouse.click(backdropBox.x + 12, backdropBox.y + backdropBox.height / 2);
  await drawer.waitFor({ state: "hidden", timeout: 5_000 });

  await menuBtn.click();
  await drawer.waitFor({ state: "visible", timeout: 5_000 });
  await page.locator(".side-nav-close").click();
  await drawer.waitFor({ state: "hidden", timeout: 5_000 });

  await menuBtn.click();
  await drawer.waitFor({ state: "visible", timeout: 5_000 });
  await page.locator("#main-navigation-drawer a[href='/lessons']").first().click();
  await page.waitForURL(/\/lessons/, { timeout: 8_000 });
  await drawer.waitFor({ state: "hidden", timeout: 5_000 });

  console.log(`✓ ${label}: menu toggle, backdrop, X, and link navigation`);
}

const browser = await chromium.launch({ headless: true });

try {
  {
    const page = await browser.newPage();
    await page.goto(new URL("/", base).toString(), { waitUntil: "networkidle" });
    await exerciseMenu(page, "Desktop Chrome");
    await page.close();
  }

  {
    const iphone = devices["iPhone 13"];
    const context = await browser.newContext({ ...iphone });
    const page = await context.newPage();
    await page.goto(new URL("/", base).toString(), { waitUntil: "networkidle" });
    await exerciseMenu(page, "iPhone Safari");
    await context.close();
  }

  console.log("\nAll navigation menu smoke checks passed.");
} catch (error) {
  console.error("\n✗ Navigation menu smoke test failed:", error);
  process.exit(1);
} finally {
  await browser.close();
}
