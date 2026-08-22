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

  const info = await p.evaluate(() => {
    const w = window;
    const names = ['gsap','ScrollTrigger','Lenis','lenis','__lenis','_lenis','ScrollSmoother','locomotive','locomotiveScroll','__nuxt','__NUXT'];
    const globals = {};
    names.forEach(k => { try { globals[k] = typeof w[k]; } catch(e){ globals[k]='err'; } });
    const de = document.documentElement;
    const se = document.scrollingElement || de;
    // hunt for a Lenis instance anywhere on window
    let lenisHunt = 'none';
    try {
      for (const k in w) {
        const v = w[k];
        if (v && typeof v === 'object' && (v.constructor && /Lenis/i.test(v.constructor.name))) { lenisHunt = k; break; }
      }
    } catch(e){ lenisHunt = 'hunt-err:'+e.message; }
    return {
      globals,
      docScrollHeight: de.scrollHeight,
      bodyScrollHeight: document.body.scrollHeight,
      scrollElScrollHeight: se.scrollHeight,
      innerHeight: w.innerHeight,
      htmlHasLenisClass: de.classList.contains('lenis'),
      lenisHunt,
      scrollY: w.scrollY,
      scrollYMax: se.scrollHeight - w.innerHeight
    };
  });
  console.log('INFO ' + JSON.stringify(info, null, 2));

  // test whether window.scrollTo sticks
  await p.evaluate(() => { window.scrollTo(0, 2000); window.dispatchEvent(new Event('scroll')); });
  await p.waitForTimeout(900);
  const a1 = await p.evaluate(() => ({ scrollY: window.scrollY }));
  console.log('AFTER_2000 ' + JSON.stringify(a1));

  await p.evaluate(() => { window.scrollTo(0, 6000); window.dispatchEvent(new Event('scroll')); });
  await p.waitForTimeout(900);
  const a2 = await p.evaluate(() => ({ scrollY: window.scrollY }));
  console.log('AFTER_6000 ' + JSON.stringify(a2));

  // list top-level big sections (likely scroll-driven panels)
  const panels = await p.evaluate(() => {
    const out = [];
    document.querySelectorAll('section, [data-section], main > *, .section, [class*="section" i]').forEach(el => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      out.push({ tag: el.tagName, cls: (el.className||'').toString().slice(0,40), h: Math.round(r.height), pos: cs.position, op: cs.opacity });
    });
    return out.slice(0, 30);
  });
  console.log('PANELS ' + JSON.stringify(panels, null, 2));

  await b.close();
})();
