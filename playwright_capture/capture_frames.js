const { chromium } = require('/Users/etteraug/.workbuddy/binaries/node/workspace/node_modules/playwright');
const fs = require('fs');
const URL = 'https://sanctuaryonthemoon.com/';
const OUT = '/Users/etteraug/Desktop/PlanetaryWeb/Kimi_Agent_行星科学网站框架/playwright_capture/frames';
fs.mkdirSync(OUT, { recursive: true });

const SECTIONS = ['.Home_hero','.HomeMoonCircles','.HomeContext','.HomeDiscs','.HomePictures','.partners','.HomePress'];
const BUCKETS = 24;
const TOTAL = 7230;

async function translateY(p) {
  return await p.evaluate(() => {
    const el = document.querySelector('.Site-scrollmain');
    if (!el) return 0;
    const m = new DOMMatrix(getComputedStyle(el).transform);
    return Math.round(m.m42);
  });
}
async function shoot(p, name) {
  try { await p.screenshot({ path: OUT + '/' + name, timeout: 60000, animations: 'disabled' }); return true; }
  catch (e) { console.log('FAIL', name, e.message.split('\n')[0]); return false; }
}
async function probe(p, progress) {
  return await p.evaluate(({ SECTIONS }) => {
    const vh = window.innerHeight;
    const pick = sel => {
      const e = document.querySelector(sel); if (!e) return null;
      const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
      return { top: Math.round(r.top), op: +(+cs.opacity).toFixed(2) };
    };
    const sections = SECTIONS.map(s => ({ s, ...pick(s) }));
    const texts = [];
    document.querySelectorAll('h1,h2,h3,p').forEach(el => {
      const r = el.getBoundingClientRect();
      const t = (el.innerText || '').trim().replace(/\s+/g, ' ');
      if (r.top >= -80 && r.bottom <= vh + 80 && t.length > 2 && t.length < 140) texts.push(t);
    });
    const sm = document.querySelector('.Site-scrollmain');
    const m = sm ? new DOMMatrix(getComputedStyle(sm).transform) : null;
    return { scrollY: m ? Math.round(m.m42) : 0, sections, texts: texts.slice(0, 14) };
  }, { SECTIONS });
}

(async () => {
  const b = await chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']
  });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await p.waitForTimeout(5000);

  // try close cookie banner
  try {
    const clicked = await p.evaluate(() => {
      const btns = [...document.querySelectorAll('button, a')];
      const b = btns.find(x => /accept all|accepte|agree|allow all|j'accepte/i.test((x.innerText || x.textContent || '')));
      if (b) { b.click(); return (b.innerText || '').trim(); }
      return null;
    });
    console.log('COOKIE_CLICK=' + clicked);
  } catch (e) { console.log('COOKIE_ERR ' + e.message); }
  await p.waitForTimeout(1500);

  const timeline = [];
  let lastShot = -99999;
  for (let i = 0; i <= BUCKETS; i++) {
    const target = -(TOTAL * i / BUCKETS);
    let guard = 0;
    while (guard++ < 80) {
      const y = await translateY(p);
      if (y <= target - 20) break;
      await p.mouse.wheel(0, 800);
      await p.waitForTimeout(70);
    }
    await p.waitForTimeout(1300); // let scrub/parallax settle
    const prog = Math.round(i * 100 / BUCKETS);
    const name = 'frame_' + String(prog).padStart(3, '0') + '.png';
    const ok = await shoot(p, name);
    const snap = await probe(p, prog);
    snap.progress = prog; snap.frame = name; snap.shot = ok;
    timeline.push(snap);
    console.log('PROGRESS ' + prog + '% scrollY=' + snap.scrollY + ' texts=' + (snap.texts[0] || '') );
  }

  fs.writeFileSync(OUT + '/timeline.json', JSON.stringify(timeline, null, 2));

  // build index.html preview
  let html = '<!doctype html><meta charset=utf-8><title>Sanctuary frames</title>'
    + '<style>body{background:#111;color:#eee;font:13px sans-serif;margin:0;padding:16px}'
    + 'h1{font-size:16px}.row{display:flex;gap:12px;align-items:flex-start;margin:14px 0;border-top:1px solid #333;padding-top:10px}'
    + 'img{width:360px;height:225px;object-fit:cover;border:1px solid #444;background:#000}'
    + '.meta{white-space:pre-wrap;font-size:12px;color:#9f9}</style>'
    + '<h1>Sanctuaryonthemoon.com — 视觉编排帧序列 (0%→100%, 24 桶)</h1>';
  timeline.forEach(t => {
    const sec = t.sections.map(s => s.s.replace('.', '') + ' top=' + s.top + ' op=' + s.op).join('\n');
    const tx = (t.texts || []).join(' | ');
    html += '<div class=row><img src="' + t.frame + '"><div class=meta>'
      + 'PROGRESS ' + t.progress + '%  scrollY=' + t.scrollY + '\n\n'
      + sec + '\n\nTEXT: ' + tx + '</div></div>';
  });
  fs.writeFileSync(OUT + '/index.html', html);

  console.log('ERRORS=' + (errs.slice(0, 5).join(' || ') || 'none'));
  console.log('DONE frames=' + timeline.length);
  await b.close();
})();
