import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 390, height: 844 });
const { createServer } = await import('http');
const { createReadStream, existsSync, statSync } = await import('fs');
const { join, extname } = await import('path');
const MIME = {'.html':'text/html','.css':'text/css','.js':'application/javascript','.json':'application/json','.png':'image/png','.svg':'image/svg+xml'};
const DIST = '/Users/alabdullmohsen/majalis-correct/artifacts/majalis/dist';
const srv = createServer((req, res) => {
  let p = join(DIST, req.url==='/'?'/index.html':req.url.split('?')[0]);
  if(!existsSync(p)||statSync(p).isDirectory()) p = join(DIST,'index.html');
  res.writeHead(200,{'Content-Type':MIME[extname(p)]||'application/octet-stream'});
  createReadStream(p).pipe(res);
});
srv.listen(9997);
await new Promise(r=>srv.once('listening',r));
const base='http://localhost:9997';

// صفحة الدروس - أعلى الصفحة (الفلاتر)
await page.goto(base+'/lessons',{waitUntil:'networkidle',timeout:15000}).catch(()=>{});
await page.waitForTimeout(2500);
await page.screenshot({path:'/tmp/L1_toolbar.png',fullPage:false});
console.log('✅ lessons toolbar');

// اضغط زر "تصفية وبحث"
const filterBtn = await page.$('.lessons-v2-filter-toggle');
if(filterBtn){ await filterBtn.click(); await page.waitForTimeout(600); await page.screenshot({path:'/tmp/L2_filter_open.png',fullPage:false}); console.log('✅ filter panel open'); }

// الصفحة الرئيسية - قسم الدروس
await page.goto(base,{waitUntil:'networkidle',timeout:15000}).catch(()=>{});
await page.waitForTimeout(2500);
// اسحب لأسفل للدروس القادمة
for(let y=300; y<2000; y+=300){
  await page.evaluate(y=>window.scrollTo(0,y),y);
  await page.waitForTimeout(200);
  const el = await page.$('.home-lessons-tabs, .home-kuwait-grid');
  if(el){ await page.screenshot({path:'/tmp/L3_home_lessons.png',fullPage:false}); console.log(`✅ home lessons at y=${y}`); break; }
}

srv.close();
await browser.close();
