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
srv.listen(9995);
await new Promise(r=>srv.once('listening',r));

await page.goto('http://localhost:9995',{waitUntil:'networkidle',timeout:15000}).catch(()=>{});
await page.waitForTimeout(2000);

// اضغط زر القائمة (☰)
const menuBtn = await page.$('.navbar-menu-btn, [aria-label="القائمة"], button[aria-label*="القائمة"]');
if(menuBtn){ await menuBtn.click(); await page.waitForTimeout(800); }
await page.screenshot({path:'/tmp/nav_drawer.png', fullPage:false});
console.log('✅ drawer screenshot');

srv.close();
await browser.close();
