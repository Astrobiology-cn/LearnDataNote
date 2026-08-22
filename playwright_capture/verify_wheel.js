const { chromium } = require('/Users/etteraug/.workbuddy/binaries/node/workspace/node_modules/playwright');
const URL = 'https://sanctuaryonthemoon.com/';

(async () => {
  const b = await chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']
  });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await p.waitForTimeout(6000);

  const t0 = await p.evaluate(() => {
    const e = document.querySelector('.Home_hero');
    return e ? Math.round(e.getBoundingClientRect().top) : null;
  });

  // drive via real wheel events (virtual scroll libs listen to wheel)
  for (let i = 0; i < 15; i++) { await p.mouse.wheel(0, 300); await p.waitForTimeout(120); }
  await p.waitForTimeout(2500);

  const t1 = await p.evaluate(() => {
    const e = document.querySelector('.Home_hero');
    return e ? Math.round(e.getBoundingClientRect().top) : null;
  });

  const mc = await p.evaluate(() => {
    const cands = [];
    document.querySelectorAll('body *').forEach(el => {
      const cs = getComputedStyle(el);
      const tr = cs.transform;
      if (tr && tr !== 'none' && tr !== 'matrix(1, 0, 0, 1, 0, 0)') {
        cands.push({ cls: (el.className || '').toString().slice(0, 30), transform: tr });
      }
    });
    return cands.slice(0, 12);
  });

  console.log('HERO_TOP_BEFORE=' + t0 + ' AFTER=' + t1 + ' (negative means scrolled)');
  console.log('TRANSFORMED_ELEMENTS=' + JSON.stringify(mc, null, 2));
  await b.close();
})();
