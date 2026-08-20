#!/usr/bin/env node
/**
 * تدقيق تباين شامل عبر الوضعين (فاتح/داكن) على مسارات حقيقية.
 *
 * لماذا هذا السكربت موجود بجانب verify-color-contrast-gate.mjs:
 * تلك بوابة انحدار مُثبَّتة على 25 عطلًا مُصلَحًا سابقًا (سريعة، تعمل في كل
 * test:regression). هذا السكربت كاشف استطلاعي: يمشي على كل عنصر نصي في كل
 * مسار، يقيس لونه المحسوب مقابل أقرب خلفية غير شفافة فعليًا، ويبلّغ عن كل
 * ما هو دون WCAG AA. استُخدم في 2026-07-25 على 16 مسارًا فكشف 47 مخالفة، ثم وُسِّع إلى 41
 * مسارًا فكشف 67 أخرى على مسارات لم تكن مغطّاة — أُصلحت كلها (114 مخالفة).
 * كل توسعة في التغطية تكشف طبقة جديدة: التغطية هنا هي الأداة نفسها.
 *
 * قاعدتان مهمّتان تعلّمناهما وهما مطبَّقتان هنا:
 *  ١) العناصر التي خلفيتها متدرّجة/صورة تُتخطّى: لا يمكن استخراج لون واحد
 *     منها، والصعود لجسم الصفحة يُنتج «أبيض على أبيض» وهمي (كان يعطي 29
 *     مخالفة كاذبة قبل هذا الاستثناء).
 *  ٢) النص الكبير حدّه 3:1 لا 4.5:1 (WCAG 1.4.3).
 *
 * التشغيل: ابنِ ثم شغّل معاينة على منفذ، ثم:
 *   BASE_URL=http://127.0.0.1:4403 node scripts/audit-theme-contrast.mjs
 */
import { chromium } from "playwright";
const B = process.env.BASE_URL || "http://127.0.0.1:4403";
const ROUTES=["/","/quran-hub","/lessons","/library","/scholars","/qa","/adhkar","/rulings",
 "/prayer-times","/seerah","/learning/paths","/sections","/about","/login","/search","/fiqh-council",
 "/prophet-stories","/quiz","/mushaf","/my-learning","/hadith","/fawaid","/miracles","/sitemap",
 "/register","/stats","/calendar","/adhan-settings","/tasbeeh-counter","/asmaa-husna",
 "/islamic-stories","/glossary","/madhahib","/sahabah","/tawhid","/zakat","/sawm","/janaza",
 "/akhlaq","/raqaiq","/404"];
const hexOf=s=>{const m=s.match(/\d+/g);return m?m.slice(0,3).map(Number):null;};
const lin=c=>{c/=255;return c<=0.03928?c/12.92:((c+0.055)/1.055)**2.4;};
const L=([r,g,b])=>0.2126*lin(r)+0.7152*lin(g)+0.0722*lin(b);
const CR=(a,b)=>{const l1=L(a),l2=L(b);const[hi,lo]=l1>l2?[l1,l2]:[l2,l1];return (hi+0.05)/(lo+0.05);};
const br=await chromium.launch();
const found=[];
for(const theme of ["light","dark"]){
 const ctx=await br.newContext({viewport:{width:1280,height:900}});
 const p=await ctx.newPage();
 for(const r of ROUTES){
  await p.goto(B+r,{waitUntil:"networkidle",timeout:25000}).catch(()=>{});
  await p.evaluate(t=>document.documentElement.setAttribute("data-theme",t),theme);
  await p.waitForTimeout(400);
  const bad=await p.evaluate(()=>{
    const res=[];
    const walk=document.querySelectorAll("a,button,span,p,h1,h2,h3,h4,li,div,td,th,label");
    for(const el of walk){
      const t=(el.innerText||"").trim();
      if(!t||t.length>90) continue;
      if(el.children.length>0 && !/^(A|BUTTON|SPAN|LABEL|TD|TH|LI)$/.test(el.tagName)) continue;
      const cs=getComputedStyle(el);
      if(cs.visibility==="hidden"||cs.display==="none"||parseFloat(cs.opacity)<0.1) continue;
      const rect=el.getBoundingClientRect();
      if(rect.width<6||rect.height<6) continue;
      // nearest opaque background
      let bg=null,n=el,skip=false;
      while(n&&n!==document.documentElement){
        const ncs=getComputedStyle(n);
        // خلفية متدرّجة/صورة: لا يمكن استخراج لون واحد موثوق ⇒ نتخطى العنصر
        // بدل الصعود لجسم الصفحة وإنتاج مخالفة وهمية (أبيض على أبيض).
        if(ncs.backgroundImage && ncs.backgroundImage!=="none"){skip=true;break;}
        const b=ncs.backgroundColor;
        const m=b.match(/[\d.]+/g);
        if(m&&(m.length<4||parseFloat(m[3])>0.85)){bg=b;break;}
        n=n.parentElement;
      }
      if(skip) continue;
      if(!bg) bg=getComputedStyle(document.body).backgroundColor;
      res.push({t:t.slice(0,40),cls:String(el.className).slice(0,42)||("<"+el.tagName+" in ."+String(el.parentElement?.className||"?").slice(0,34)+">"),color:cs.color,bg,
                fs:parseFloat(cs.fontSize),fw:cs.fontWeight});
    }
    return res;
  });
  for(const it of bad){
    const c=hexOf(it.color),g=hexOf(it.bg);
    if(!c||!g) continue;
    const ratio=CR(c,g);
    const large=(it.fs>=24)||(it.fs>=18.66&&parseInt(it.fw)>=700);
    const min=large?3:4.5;
    if(ratio<min) found.push({theme,route:r,...it,ratio:+ratio.toFixed(2),min});
  }
 }
 await ctx.close();
}
await br.close();
const seen=new Set(),uniq=[];
for(const f of found){const k=f.theme+f.cls+f.color+f.bg;if(seen.has(k))continue;seen.add(k);uniq.push(f);}
uniq.sort((a,b)=>a.ratio-b.ratio);
console.log(`إجمالي مخالفات فريدة: ${uniq.length}`);
if (uniq.length) process.exitCode = 1;
for(const f of uniq)
  console.log(`[${f.theme}] ${String(f.ratio).padStart(5)}:1 ${f.route} ${f.color} on ${f.bg} | .${f.cls} «${f.t.slice(0,30)}»`);
