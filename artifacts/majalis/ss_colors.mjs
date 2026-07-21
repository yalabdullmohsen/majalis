import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const { createServer } = await import('http');
const { createReadStream, existsSync, statSync } = await import('fs');
const { join, extname } = await import('path');
const MIME = {'.html':'text/html','.css':'text/css','.js':'application/javascript','.json':'application/json','.png':'image/png','.svg':'image/svg+xml'};
const DIST = '/Users/alabdullmohsen/majalis-correct/artifacts/majalis/dist';
const srv = createServer((req, res) => {
  let p = join(DIST, req.url==='/'?'/index.html':req.url.split('?')[0]);
  if(!existsSync(p)||statSync(p).isDirectory()) p = join(DIST,'index.html');
  res.writeHead(200,{'Content-Type':MIME[extname(p)]||'text/html','Cache-Control':'no-cache'});
  createReadStream(p).pipe(res);
});
srv.listen(9992);
await new Promise(r=>srv.once('listening',r));

const page = await browser.newPage();
await page.setViewportSize({ width: 390, height: 844 });
await page.goto('http://localhost:9992/fawaid',{waitUntil:'networkidle',timeout:12000}).catch(()=>{});
await page.waitForTimeout(2000);

// اقرأ لون البطاقة الأولى
const colors = await page.evaluate(() => {
  const cards = document.querySelectorAll('.ui-card, .faidah-card, .highlighted-content-card');
  return Array.from(cards).slice(0,3).map(el => ({
    classes: el.className,
    bg: window.getComputedStyle(el).backgroundColor,
  }));
});
console.log('🎨 ألوان بطاقات الفوائد:', JSON.stringify(colors, null, 2));

srv.close();
await browser.close();
