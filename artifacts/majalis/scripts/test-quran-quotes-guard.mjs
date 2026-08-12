#!/usr/bin/env node
/**
 * حارس الاقتباسات القرآنية — يفحص كل نص قرآني معروض في الموقع.
 *
 * يطابق كل ما بين ﴿﴾ وما بين {} داخل سلسلة نصية، وكل حقل arabic/verse/ayah
 * مقرونٍ بمرجع، على مصحف
 * المشروع (public/data/quran)، ويتحقق أن كل «سورة X: رقم» داخل نطاق آياتها.
 * كشف عند إنشائه (2026-07-25) ثمانية أخطاء حقيقية: زيادة على النص في دعاء
 * أيوب ﵇، ودمج آيتين من سورتين في نص واحد، وتبديل ترتيب كلمات آيتين،
 * واقتباسات مبتورة بلا علامة حذف.
 *
 * التشغيل: node scripts/test-quran-quotes-guard.mjs
 */
import fs from "node:fs"; import path from "node:path";
const ROOT=path.resolve(path.dirname(new URL(import.meta.url).pathname),"..");
const DIAC=/[ؐ-ًؚ-ٟۖ-ۭـ۝]/g;
const norm=(t)=>t.replace(/﻿/g,"").replace(/وٰ/g,"ا").replace(/ٰ/g,"ا").replace(/[ٕٓٔ]/g,"")
 .replace(DIAC,"").replace(/بصۜ?ط/g,"بسط").replace(/[آأإٱىي]/g,"ا").replace(/ة/g,"ه")
 .replace(/[^ء-ي]/g,"").replace(/[اءئؤ]/g,"").replace(/ل{2,}/g,"ل");
const nn=(x)=>x.replace(DIAC,"").replace(/ٰ/g,"ا").replace(/[آأإٱ]/g,"ا").replace(/ى/g,"ي").replace(/ة/g,"ه").replace(/[^ء-ي]/g,"").replace(/^سوره/,"");
const S=[]; for(let i=1;i<=114;i++){const d=JSON.parse(fs.readFileSync(path.join(ROOT,"public/data/quran",`surah-${String(i).padStart(3,"0")}.json`),"utf8"));
  S.push({n:i,name:d.name,count:d.numberOfAyahs,joined:d.ayahs.map(a=>norm(a.text)).join("")});}
const corpus=S.map(s=>s.joined).join("");
const byName=new Map(S.map(s=>[nn(s.name),s]));
const files=[];(function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){if(e.name==="node_modules"||e.name.startsWith("."))continue;const p=path.join(d,e.name);e.isDirectory()?walk(p):/\.(ts|tsx)$/.test(e.name)&&!p.includes("__tests__")&&files.push(p);}})(path.join(ROOT,"src"));
let checked=0,bad=0,refs=0,refBad=0;const issues=[];
for(const f of files){
  const s=fs.readFileSync(f,"utf8");
  // 1) نصوص بين ﴿﴾
  for(const m of s.matchAll(/﴿([^﴾"\\n]{8,700})﴾/g))
    for(const piece of m[1].split(/\s*\*\s*|…|\.\.\./)){
      const q=norm(piece); if(q.length<12)continue; checked++;
      if(!corpus.includes(q)){bad++;issues.push(`${path.relative(ROOT,f)}  ﴿${piece.trim().slice(0,55)}﴾`);}
    }
  // 1ب) نصوص بين {} داخل سلسلة نصية — عرف تطويق ثانٍ للاستشهاد القرآني كان
  //     يمرّ بلا مقابلة (كُشف ج-٣٨٧ في adhkar-seed: adh-160/169/267). القصر على
  //     ما بين علامتَي اقتباس يستبعد تعليقات JSX ‏{/* … */}‏ وكتل الشفرة.
  for(const lit of s.matchAll(/"((?:[^"\\\n]|\\.)*)"/g))
    for(const m of lit[1].matchAll(/\{([^{}]{8,700})\}/g)){
      if(!/[ء-ي]/.test(m[1]))continue;
      for(const piece of m[1].split(/\s*\*\s*|…|\.\.\./)){
        const q=norm(piece); if(q.length<12)continue; checked++;
        if(!corpus.includes(q)){bad++;issues.push(`${path.relative(ROOT,f)}  {${piece.trim().slice(0,55)}}`);}
      }
    }
  // 2) حقول arabic/verse/ayah/text مع ref/reference صريح لسورة
  for(const m of s.matchAll(/(?:arabic|verse|ayah|ayahText)\s*:\s*"((?:[^"\\]|\\.){12,})"\s*,\s*\n?\s*(?:ref|reference|surahRef)\s*:\s*"([^"]+)"/g)){
    const q=norm(m[1]); if(q.length<12)continue; checked++;
    if(!corpus.includes(q)){bad++;issues.push(`${path.relative(ROOT,f)}  «${m[1].slice(0,55)}» [${m[2]}]`);}
  }
  // 2ب) بنية quranEvidence: [{ text, source: "سورة X: N" }] — نصوص قرآنية بلا أقواس
  for(const m of s.matchAll(/text:\s*"((?:[^"\\]|\\.){12,})",\s*\n?\s*source:\s*"سورة\s+([^":]+):\s*([\d\-،, ]+)"/g)){
    const q=norm(m[1]); if(q.length<12)continue; checked++;
    if(!corpus.includes(q)){bad++;issues.push(`${path.relative(ROOT,f)}  «${m[1].slice(0,55)}» [سورة ${m[2]}: ${m[3]}]`);}
  }

  // 3) صحة أرقام الآيات في المراجع «سورة كذا: رقم»
  for(const m of s.matchAll(/سورة\s+([ء-ي]{3,14})\s*:\s*(\d{1,3})/g)){
    const su=byName.get(nn(m[1])); if(!su)continue; refs++;
    if(+m[2]<1||+m[2]>su.count){refBad++;issues.push(`${path.relative(ROOT,f)}  سورة ${m[1]} ليس فيها آية ${m[2]} (لها ${su.count})`);}
  }
}
console.log(`ملفات: ${files.length} | نصوص قرآنية مفحوصة: ${checked} | غير مطابقة: ${bad}`);
console.log(`مراجع «سورة X: رقم»: ${refs} | خارج النطاق: ${refBad}\n`);
issues.slice(0,40).forEach(i=>console.log("✗ "+i));
if(issues.length>40)console.log(`… و${issues.length-40} أخرى`);
if(issues.length){console.log("\n\x1b[31m✗ حارس الاقتباسات القرآنية: "+issues.length+" مخالفة\x1b[0m");process.exit(1);}
console.log("\x1b[32m✓ حارس الاقتباسات القرآنية: كل نص قرآني معروض مطابق للمصحف\x1b[0m");
