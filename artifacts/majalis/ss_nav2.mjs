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
  res.writeHead(200,{'Content-Type':MIME[extname(p)]||'application/octet-stream','Cache-Control':'no-cache'});
  createReadStream(p).pipe(res);
});
srv.listen(9994);
await new Promise(r=>srv.once('listening',r));

await page.goto('http://localhost:9994',{waitUntil:'networkidle',timeout:15000}).catch(()=>{});
await page.waitForTimeout(2000);

// اضغط زر القائمة
const menuBtn = await page.$('.navbar-menu-btn, button[aria-label*="القائمة"]');
if(menuBtn){ await menuBtn.click(); await page.waitForTimeout(800); }

// اقرأ لون الخلفية الفعلي للدرج
const bgColor = await page.evaluate(() => {
  const drawer = document.querySelector('.side-nav-drawer--v2');
  const body = document.querySelector('.side-nav-drawer__body');
  const head = document.querySelector('.side-nav-drawer__head--v2');
  if(!drawer) return 'DRAWER NOT FOUND';
  const s = window.getComputedStyle(drawer);
  const sb = body ? window.getComputedStyle(body) : null;
  const sh = head ? window.getComputedStyle(head) : null;
  return {
    drawer: s.backgroundColor,
    body: sb?.backgroundColor,
    head: sh?.backgroundColor,
  };
});
console.log('🎨 لون الخلفية الفعلي:', JSON.stringify(bgColor, null, 2));

await page.screenshot({path:'/tmp/nav_drawer2.png', fullPage:false});
srv.close();
await browser.close();
