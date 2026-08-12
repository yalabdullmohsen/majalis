import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 390, height: 844 });
const { createServer } = await import('http');
const { createReadStream, existsSync, statSync } = await import('fs');
const { join, extname } = await import('path');
const MIME = {'.html':'text/html','.css':'text/css','.js':'application/javascript','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'};
const DIST = '/Users/alabdullmohsen/majalis-correct/artifacts/majalis/dist';
const srv = createServer((req, res) => {
  let p = join(DIST, req.url==='/'?'/index.html':req.url.split('?')[0]);
  if(!existsSync(p)||statSync(p).isDirectory()) p = join(DIST,'index.html');
  res.writeHead(200,{'Content-Type':MIME[extname(p)]||'application/octet-stream'});
  createReadStream(p).pipe(res);
});
srv.listen(9998);
await new Promise(r=>srv.once('listening',r));
const base='http://localhost:9998';

await page.goto(base+'/lessons',{waitUntil:'networkidle',timeout:15000}).catch(()=>{});
await page.waitForTimeout(2500);
await page.screenshot({path:'/tmp/lessons_full.png',fullPage:false});
console.log('✅ lessons top');
await page.evaluate(()=>window.scrollTo(0,400));
await page.waitForTimeout(500);
await page.screenshot({path:'/tmp/lessons_mid.png',fullPage:false});
console.log('✅ lessons mid');

srv.close();
await browser.close();
