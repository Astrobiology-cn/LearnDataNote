const { chromium } = require('/Users/etteraug/.workbuddy/binaries/node/workspace/node_modules/playwright');
const fs = require('fs');

const URL = 'https://sanctuaryonthemoon.com/';
const OUT = '/Users/etteraug/Desktop/PlanetaryWeb/Kimi_Agent_行星科学网站框架/playwright_capture';
fs.mkdirSync(OUT, { recursive: true });

async function shoot(page, name) {
  try {
    await page.screenshot({ path: OUT + '/' + name, timeout: 90000, animations: 'disabled' });
    console.log('OK ', name);
  } catch (e) {
    console.log('FAIL', name, '->', e.message.split('\n')[0]);
  }
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('console', m => { if (m.type()==='error') errors.push('CONSOLE: '+m.text()); });
  page.on('pageerror', e => errors.push('PAGEERR: '+e.message));
  try {
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  } catch (e) { errors.push('GOTO: '+e.message); }
  await page.waitForTimeout(6000);

  await shoot(page, 'frame_00_top.png');

  let h = 0;
  try { h = await page.evaluate(() => document.body.scrollHeight); } catch(e){}
  console.log('scrollHeight=', h);

  for (const frac of [0.25,0.5,0.75,1.0]) {
    try { await page.evaluate(f => window.scrollTo(0, Math.round(document.body.scrollHeight*f)), frac); } catch(e){}
    await page.waitForTimeout(3000);
    const name = 'frame_'+ (Math.round(frac*100)).toString().padStart(3,'0') + '.png';
    await shoot(page, name);
  }

  let webgl = 'unknown';
  try {
    webgl = await page.evaluate(() => {
      const c = document.createElement('canvas');
      const gl = c.getContext('webgl') || c.getContext('experimental-webgl');
      if (!gl) return 'no-webgl';
      return gl.getParameter(gl.VERSION) + ' | ' + gl.getParameter(gl.RENDERER);
    });
  } catch(e){ webgl = 'eval-err: '+e.message; }
  console.log('WEBGL=', webgl);
  console.log('ERRORS=', errors.slice(0,20).join(' || ') || 'none');
  await browser.close();
})();
