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
srv.listen(9991);
await new Promise(r=>srv.once('listening',r));
const page = await browser.newPage();
await page.setViewportSize({ width: 390, height: 844 });
await page.goto('http://localhost:9991/hadith',{waitUntil:'networkidle',timeout:12000}).catch(()=>{});
await page.waitForTimeout(2000);

// افحص العناصر التي لها border أصفر/عنبري
const info = await page.evaluate(() => {
  const all = document.querySelectorAll('*');
  const found = [];
  for (const el of all) {
    const s = window.getComputedStyle(el);
    const bb = s.borderBottomColor;
    const bc = s.borderColor;
    // ابحث عن ألوان عنبرية/صفراء (r>150, g>100, b<100)
    const check = (c) => {
      const m = c.match(/rgb\((\d+),\s*(\d+),\s*(\d+)/);
      if (!m) return false;
      const [,r,g,b] = m.map(Number);
      return r > 150 && g > 80 && b < 80;
    };
    if (check(bb) || check(bc)) {
      found.push({ tag: el.tagName, cls: el.className.slice(0,60), bb, bc });
    }
  }
  return found.slice(0, 10);
});
console.log('🔍 عناصر بحد عنبري/أصفر:', JSON.stringify(info, null, 2));
srv.close();
await browser.close();
