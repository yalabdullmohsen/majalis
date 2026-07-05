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
srv.listen(9993);
await new Promise(r=>srv.once('listening',r));
const base = 'http://localhost:9993';

const pages = [
  ['/', 'p_home'],
  ['/tawhid', 'p_tawhid'],
  ['/hadith', 'p_hadith'],
  ['/rulings', 'p_rulings'],
  ['/lessons', 'p_lessons'],
  ['/library', 'p_library'],
  ['/quran', 'p_quran'],
  ['/qa', 'p_qa'],
  ['/fawaid', 'p_fawaid'],
  ['/adhkar', 'p_adhkar'],
];

for(const [path, name] of pages) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base+path,{waitUntil:'networkidle',timeout:12000}).catch(()=>{});
  await page.waitForTimeout(1500);
  await page.screenshot({path:`/tmp/${name}.png`,fullPage:false});
  await page.close();
  console.log(`✅ ${name}`);
}

srv.close();
await browser.close();
