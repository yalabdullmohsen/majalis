#!/usr/bin/env node
/**
 * حارس تخريج الأحاديث — لا يُنسب قولٌ إلى النبي ﷺ في الموقع بلا تخريج.
 *
 * يلتقط كل موضع إسنادٍ صريح («قال ﷺ:»، «قوله ﷺ:») متبوعٍ باقتباس، ويتحقق
 * أن التخريج حاضرٌ في النص أو في حقلٍ مجاور داخل نفس الكائن (source/grade).
 * كشف عند إنشائه (2026-07-25) عشرين حديثاً بلا تخريج، وثلاثة ألفاظ لم تثبت
 * مرفوعةً إلى النبي ﷺ فاستُبدلت بالثابت أو بُيّن حالها.
 *
 * التشغيل: node scripts/test-hadith-takhrij-guard.mjs
 */
import fs from "node:fs"; import path from "node:path";
const ROOT=path.resolve(path.dirname(new URL(import.meta.url).pathname),"..");
const TAKHRIJ=/(رواه|أخرجه|متفق عليه|البخاري|مسلم|الترمذي|أبو داود|النسائي|ابن ماجه|أحمد|صححه|حسّنه|حسنه|ضعّفه|الألباني|صحيح الجامع|السلسلة|الصحيحين|في صحيحه|الموطأ|الدارمي|الحاكم|البيهقي|الطبراني|الدارقطني|صحيح|حسن|ضعيف|موضوع|لا أصل له)/;
// عبارات نبوية صريحة تستوجب تخريجاً
const NABAWI=/(?:قال\s+(?:رسول\s+الله\s+|النبي\s+)?ﷺ|قوله\s+ﷺ|وقال\s+ﷺ)\s*:?\s*[«"]?[ء-ي]{3,}/;
const files=[];(function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){if(e.name==="node_modules"||e.name.startsWith("."))continue;const p=path.join(d,e.name);e.isDirectory()?walk(p):/\.(ts|tsx)$/.test(e.name)&&!p.includes("__tests__")&&files.push(p);}})(path.join(ROOT,"src"));
const issues=[];let total=0;
for(const f of files){
  const src=fs.readFileSync(f,"utf8");
  // نلتقط موضع الإسناد نفسه ونفحص نافذةً حوله — لا السلسلة كاملة، لأن حقلاً
  // مجاوراً في نفس الكائن قد يحمل التخريج، وحقلاً آخر قد يذكر النبي ﷺ وصفاً
  // لا اقتباساً.
  for(const m of src.matchAll(/(?:قال\s+(?:رسول\s+الله\s+|النبي\s+)?ﷺ|قوله\s+ﷺ|وقال\s+ﷺ)\s*:?\s*[«"]/g)){
    total++;
    const ctx = src.slice(m.index, m.index + 600);
    const before = src.slice(Math.max(0, m.index - 250), m.index);
    if(!TAKHRIJ.test(ctx) && !TAKHRIJ.test(before)){
      const line = src.slice(0, m.index).split("\n").length;
      issues.push(`${path.relative(ROOT,f)}:${line}  ${ctx.replace(/\\n/g," ").slice(0,95)}`);
    }
  }
}
console.log(`نصوص فيها إسناد صريح للنبي ﷺ: ${total} | بلا تخريج: ${issues.length}\n`);
issues.slice(0,400).forEach(i=>console.log("✗ "+i));
if(issues.length>400)console.log(`… و${issues.length-30} أخرى`);
if(issues.length){
  console.error(`\n✗ حارس التخريج: ${issues.length} موضعًا بلا تخريج`);
  process.exit(1);
}
console.log("✓ حارس التخريج: كل إسناد نبوي صريح معه تخريج أو بيان حال");
