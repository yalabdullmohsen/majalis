#!/usr/bin/env node
/**
 * يزامن كتلة noscript في index.html مع src/data/content-counts.json.
 * يمنع أرقامًا يدوية متقادمة (117 كتاب / 96 عالم / …) من التسرب لمحركات البحث.
 *
 * التشغيل: node scripts/sync-index-noscript.mjs
 * يُستدعى من generate:counts بعد كتابة content-counts.json.
 */
import { readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const countsPath = resolve(appRoot, "src/data/content-counts.json");
const indexPath = resolve(appRoot, "index.html");

const counts = JSON.parse(await readFile(countsPath, "utf8"));
const html = await readFile(indexPath, "utf8");

const startMark = "<!-- CONTENT_COUNTS_NOSCRIPT_BEGIN -->";
const endMark = "<!-- CONTENT_COUNTS_NOSCRIPT_END -->";

const block = `${startMark}
        <section>
          <h2>الدروس والدورات الشرعية</h2>
          <p>${counts.courses} دورة علمية في التفسير والحديث والعقيدة والفقه والبلاغة والنحو والفرائض والأذكار والسيرة.</p>
        </section>
        <section>
          <h2>القرآن الكريم</h2>
          <p>المصحف الشريف، أحكام التجويد، قصص السور، علوم القرآن، وأدوات التسميع والتحفيظ.</p>
        </section>
        <section>
          <h2>مكتبة الكتب الشرعية</h2>
          <p>${counts.books} كتابًا في التفسير والحديث والفقه والعقيدة والأصول واللغة والتاريخ.</p>
          <ul>
            <li><a href="/library/book-bukhari">صحيح البخاري</a></li>
            <li><a href="/library/book-muslim">صحيح مسلم</a></li>
            <li><a href="/library/book-tafsir-ibnkathir">تفسير ابن كثير</a></li>
            <li><a href="/library/book-riyadh">رياض الصالحين</a></li>
            <li><a href="/library/book-mughni">المغني لابن قدامة</a></li>
            <li><a href="/library/book-fiqh-sunnah">الفقه على المذاهب الأربعة</a></li>
            <li><a href="/library/book-ihya">إحياء علوم الدين للغزالي</a></li>
            <li><a href="/library/book-raheeq">الرحيق المختوم</a></li>
          </ul>
        </section>
        <section>
          <h2>العلماء والأئمة</h2>
          <p>${counts.scholars} عالِمًا من أئمة المذاهب الأربعة والمحدثين والمفسرين والفقهاء.</p>
          <ul>
            <li><a href="/scholars/abu-hanifa">الإمام أبو حنيفة النعمان</a></li>
            <li><a href="/scholars/malik">الإمام مالك بن أنس</a></li>
            <li><a href="/scholars/shafi">الإمام الشافعي</a></li>
            <li><a href="/scholars/ahmad">الإمام أحمد بن حنبل</a></li>
            <li><a href="/scholars/bukhari">الإمام البخاري</a></li>
            <li><a href="/scholars/ibn-taymiyya">شيخ الإسلام ابن تيمية</a></li>
            <li><a href="/scholars/ibn-qayyim">ابن القيم الجوزية</a></li>
            <li><a href="/scholars/nawawi">الإمام النووي</a></li>
          </ul>
        </section>
        <section>
          <h2>الأذكار الإسلامية</h2>
          <p>${counts.adhkar} ذكرًا ووردًا: أذكار الصباح والمساء، أذكار الصلاة، والأوراد اليومية.</p>
        </section>
        <section>
          <h2>الفقه والأحكام</h2>
          <p>${counts.rulings} مسألة فقهية مع أدلة ومراجع، ضمن قسم الفقه والأحكام.</p>
        </section>
        <section>
          <h2>اختبر معلوماتك — لعبة سؤال وجواب</h2>
          <p>${counts.quizQuestions} سؤالًا تعليميًا في السيرة والفقه والعقيدة والقرآن والتاريخ.</p>
        </section>
        <section>
          <h2>الأسئلة العلمية</h2>
          <p>${counts.qa} سؤالًا وجوابًا علميًا مفصولًا عن اللعبة التعليمية.</p>
        </section>
${endMark}`;

let next;
if (html.includes(startMark) && html.includes(endMark)) {
  const re = new RegExp(
    `${startMark.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${endMark.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
  );
  next = html.replace(re, block);
} else {
  // ترحيل لمرة واحدة: استبدال أقسام الإحصاءات القديمة داخل آخر noscript
  const noscriptRe = /(<noscript>\s*<style>[\s\S]*?<\/style>\s*<main>[\s\S]*?<nav[\s\S]*?<\/nav>)([\s\S]*?)(<\/main>\s*<\/noscript>)/i;
  if (!noscriptRe.test(html)) {
    console.error("✗ لم يُعثر على كتلة noscript للمحتوى في index.html");
    process.exit(1);
  }
  next = html.replace(noscriptRe, `$1\n${block}\n      $3`);
}

if (next === html) {
  console.log("✓ index.html noscript متزامن أصلًا مع content-counts.json");
} else {
  await writeFile(indexPath, next, "utf8");
  console.log("✓ حُدِّث index.html noscript من content-counts.json", {
    books: counts.books,
    scholars: counts.scholars,
    courses: counts.courses,
    rulings: counts.rulings,
    quizQuestions: counts.quizQuestions,
    qa: counts.qa,
    adhkar: counts.adhkar,
  });
}
