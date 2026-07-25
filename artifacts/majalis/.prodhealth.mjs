import { chromium } from "playwright";
const B="https://majlisilm.com";
const R=["/","/quran-hub","/lessons","/library","/scholars","/qa","/adhkar","/rulings",
 "/prayer-times","/seerah","/learning/paths","/topics","/about","/search","/fiqh-council",
 "/prophet-stories","/quiz","/mushaf","/hadith","/fawaid","/miracles","/calendar",
 "/my-learning","/islamic-stories","/madhahib","/sahabah","/tawhid","/zakat","/janaza",
 "/sitemap","/login","/404"];
const br=await chromium.launch();
let bad=0;
for(const [tag,vp] of [["desktop",{width:1280,height:900}],["iPhone",{width:390,height:844}]]){
  const ctx=await br.newContext({viewport:vp});
  const p=await ctx.newPage();
  console.log(`\n════ ${tag} (بيانات حيّة) ════`);
  for(const r of R){
    const errs=[];
    p.on("pageerror",e=>errs.push("JS: "+String(e).slice(0,100)));
    p.on("console",m=>{if(m.type()==="error")errs.push(m.text().slice(0,100));});
    const resp=await p.goto(B+r,{waitUntil:"networkidle",timeout:35000}).catch(()=>null);
    await p.waitForTimeout(500);
    const i=await p.evaluate(()=>({
      len:document.body.innerText.replace(/\s+/g," ").trim().length,
      over:document.documentElement.scrollWidth-document.documentElement.clientWidth,
      h1:(document.querySelector("h1")?.textContent||"").trim().slice(0,28),
    }));
    const real=errs.filter(e=>!/favicon|manifest|net::ERR_|Failed to load resource: the server responded with a status of 4/i.test(e));
    const f=[];
    if(!resp||resp.status()>=400) f.push(`HTTP ${resp?resp.status():"fail"}`);
    if(i.len<200) f.push("محتوى ضئيل");
    if(i.over>1) f.push(`فيض ${i.over}px`);
    if(real.length) f.push(`${real.length} خطأ`);
    if(f.length){bad++;console.log(`✗ ${r.padEnd(18)} ${f.join(" · ")}`);real.slice(0,2).forEach(e=>console.log("      "+e));}
    p.removeAllListeners("pageerror");p.removeAllListeners("console");
  }
  await ctx.close();
}
await br.close();
console.log(`\n${bad===0?"✅ كل الصفحات سليمة على الإنتاج":"صفحات بمشاكل: "+bad}`);
