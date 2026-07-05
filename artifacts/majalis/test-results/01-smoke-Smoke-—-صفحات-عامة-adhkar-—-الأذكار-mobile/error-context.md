# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 01-smoke.spec.ts >> Smoke — صفحات عامة >> [/adhkar] — الأذكار
- Location: tests/01-smoke.spec.ts:41:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForTimeout: Test timeout of 30000ms exceeded.
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - link "تخطّي إلى المحتوى" [ref=e4] [cursor=pointer]:
    - /url: "#main-content"
  - banner [ref=e5]:
    - generic [ref=e6]:
      - generic [ref=e7]:
        - button "القائمة" [ref=e8] [cursor=pointer]:
          - img [ref=e9]
          - generic [ref=e11]: القائمة
        - link "المجلس العلمي" [ref=e12] [cursor=pointer]:
          - /url: /
          - generic [ref=e13]: المجلس العلمي
      - button "البحث الشامل (⌘K)" [ref=e15] [cursor=pointer]:
        - img [ref=e16]
        - generic [ref=e19]: ⌘K
  - main [ref=e20]:
    - status "جارٍ تحميل الصفحة…" [ref=e21]:
      - img [ref=e22]
      - paragraph [ref=e25]: جارٍ تحميل الصفحة…
  - contentinfo "تذييل موقع المجلس العلمي" [ref=e26]:
    - generic [ref=e27]:
      - generic [ref=e28]:
        - img [ref=e29]
        - img [ref=e32]
        - generic [ref=e33]:
          - strong [ref=e34]: المجلس العلمي
          - paragraph [ref=e35]: تطبيق علمي شرعي للدروس والعبادة والمحتوى اليومي.
          - paragraph [ref=e36]:
            - link "yalabdullmohsen1@gmail.com" [ref=e37] [cursor=pointer]:
              - /url: mailto:yalabdullmohsen1@gmail.com
      - generic [ref=e38]:
        - generic [ref=e39]:
          - paragraph [ref=e40]: المحتوى
          - navigation [ref=e41]:
            - link "الدروس" [ref=e42] [cursor=pointer]:
              - /url: /lessons
            - link "الفوائد" [ref=e43] [cursor=pointer]:
              - /url: /fawaid
            - link "الأحاديث" [ref=e44] [cursor=pointer]:
              - /url: /hadith
            - link "القصص" [ref=e45] [cursor=pointer]:
              - /url: /stories
            - link "الأسئلة" [ref=e46] [cursor=pointer]:
              - /url: /qa
        - generic [ref=e47]:
          - paragraph [ref=e48]: العبادة
          - navigation [ref=e49]:
            - link "القرآن" [ref=e50] [cursor=pointer]:
              - /url: /quran
            - link "الأذكار" [ref=e51] [cursor=pointer]:
              - /url: /adhkar
            - link "مواقيت الصلاة" [ref=e52] [cursor=pointer]:
              - /url: /prayer-times
            - link "التسابيح" [ref=e53] [cursor=pointer]:
              - /url: /tasbih
        - generic [ref=e54]:
          - paragraph [ref=e55]: التطبيق
          - navigation [ref=e56]:
            - link "من نحن" [ref=e57] [cursor=pointer]:
              - /url: /about
            - link "تواصل معنا" [ref=e58] [cursor=pointer]:
              - /url: /contact
            - link "مميزات قيد التطوير" [ref=e59] [cursor=pointer]:
              - /url: /features-in-progress
            - link "الخصوصية" [ref=e60] [cursor=pointer]:
              - /url: /privacy
            - link "الشروط" [ref=e61] [cursor=pointer]:
              - /url: /terms
      - paragraph [ref=e62]: © 2026 المجلس العلمي
  - navigation "التنقل السفلي" [ref=e63]:
    - link "الرئيسية" [ref=e64] [cursor=pointer]:
      - /url: /
      - img [ref=e66]
      - generic [ref=e69]: الرئيسية
    - link "الدروس" [ref=e70] [cursor=pointer]:
      - /url: /lessons
      - img [ref=e72]
      - generic [ref=e75]: الدروس
    - 'link "الصلاة القادمة: العصر 3:27 م" [ref=e76] [cursor=pointer]':
      - /url: /prayer-times
      - generic [ref=e77]:
        - img [ref=e78]
        - generic: 3:27 م
      - generic [ref=e83]: الصلاة
    - link "القرآن" [ref=e84] [cursor=pointer]:
      - /url: /quran
      - img [ref=e86]
      - generic [ref=e88]: القرآن
    - button "قائمة التطبيق" [ref=e89] [cursor=pointer]:
      - img [ref=e91]
      - generic [ref=e96]: المزيد
```

# Test source

```ts
  1  | import type { Page, ConsoleMessage } from "@playwright/test";
  2  | 
  3  | /** Collect JS console errors (ignores network noise and known non-critical warnings) */
  4  | export function collectConsoleErrors(page: Page): ConsoleMessage[] {
  5  |   const errors: ConsoleMessage[] = [];
  6  |   const IGNORE = [
  7  |     "Failed to load resource",
  8  |     "net::ERR",
  9  |     "favicon",
  10 |     "supabase",
  11 |     "[vite]",
  12 |     "Content-Security-Policy",
  13 |     "ResizeObserver",
  14 |   ];
  15 |   page.on("console", (msg) => {
  16 |     if (msg.type() === "error") {
  17 |       const text = msg.text();
  18 |       if (!IGNORE.some((s) => text.includes(s))) {
  19 |         errors.push(msg);
  20 |       }
  21 |     }
  22 |   });
  23 |   return errors;
  24 | }
  25 | 
  26 | /** Wait until the lazy-loading spinner is gone */
  27 | export async function waitForContent(page: Page) {
  28 |   await page.waitForLoadState("domcontentloaded");
  29 |   // Give React time to hydrate + lazy load
> 30 |   await page.waitForTimeout(600);
     |              ^ Error: page.waitForTimeout: Test timeout of 30000ms exceeded.
  31 | }
  32 | 
  33 | /** Measure Core Web Vitals using PerformanceObserver entries */
  34 | export async function measurePerf(page: Page): Promise<{
  35 |   fcp: number | null;
  36 |   lcp: number | null;
  37 |   cls: number | null;
  38 | }> {
  39 |   return page.evaluate(() => {
  40 |     return new Promise<{ fcp: number | null; lcp: number | null; cls: number | null }>(
  41 |       (resolve) => {
  42 |         const result = { fcp: null as number | null, lcp: null as number | null, cls: null as number | null };
  43 |         let clsValue = 0;
  44 | 
  45 |         try {
  46 |           new PerformanceObserver((list) => {
  47 |             for (const e of list.getEntries()) {
  48 |               if (e.name === "first-contentful-paint") result.fcp = Math.round(e.startTime);
  49 |             }
  50 |           }).observe({ type: "paint", buffered: true });
  51 | 
  52 |           new PerformanceObserver((list) => {
  53 |             for (const e of list.getEntries()) result.lcp = Math.round(e.startTime);
  54 |           }).observe({ type: "largest-contentful-paint", buffered: true });
  55 | 
  56 |           new PerformanceObserver((list) => {
  57 |             for (const e of list.getEntries()) {
  58 |               const le = e as PerformanceEntry & { value: number; hadRecentInput: boolean };
  59 |               if (!le.hadRecentInput) clsValue += le.value;
  60 |             }
  61 |           }).observe({ type: "layout-shift", buffered: true });
  62 |         } catch {
  63 |           /* unsupported */
  64 |         }
  65 | 
  66 |         setTimeout(() => {
  67 |           result.cls = Math.round(clsValue * 1000) / 1000;
  68 |           resolve(result);
  69 |         }, 2500);
  70 |       },
  71 |     );
  72 |   });
  73 | }
  74 | 
```