import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { getNewsByCategory, newsData } from '../lib/content';
import type { News } from '../lib/content';

const AUTOPLAY_MS = 6000;
const WIPE_MS = 750;

/* clip-path 斜向擦除 + 标题右滑入（CSS animation，组件内一次性注入） */
const carouselStyles = `
.news-cover-in { animation: news-cover-in 0.7s var(--ease-sanctuary) both; }
@keyframes news-cover-in {
  from { clip-path: polygon(100% 0, 100% 0, 84% 100%, 84% 100%); }
  to { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); }
}
.news-cover-out { animation: news-cover-out 0.7s var(--ease-sanctuary) both; }
@keyframes news-cover-out {
  from { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); }
  to { clip-path: polygon(0 0, 0 0, 16% 0, 0 16%); }
}
.news-title-in { animation: news-title-in 0.6s var(--ease-out-expo) both; }
@keyframes news-title-in {
  from { transform: translateX(56px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
`;

/* ═══════════════════════════════════════════════════════════════
   NewsCover — 程序生成的 SVG 线框封面（coverVariant 1-6）
   细线 currentColor 低透明度 + 铜橙单一焦点元素
   ═══════════════════════════════════════════════════════════════ */
function NewsCover({ variant }: { variant: number }) {
  const wire = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1,
  } as const;
  const copper = {
    className: 'text-primary',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
  } as const;

  let art: React.ReactNode = null;
  switch (variant) {
    case 1: /* 轨道 */
      art = (
        <>
          <g {...wire} opacity={0.28}>
            <circle cx="320" cy="180" r="120" />
            <ellipse cx="320" cy="180" rx="220" ry="70" />
            <ellipse cx="320" cy="180" rx="220" ry="70" transform="rotate(30 320 180)" />
            <ellipse cx="320" cy="180" rx="220" ry="70" transform="rotate(-30 320 180)" />
          </g>
          <g {...copper}>
            <circle cx="320" cy="180" r="4" fill="currentColor" stroke="none" />
            <circle cx="527" cy="156" r="7" />
            <circle cx="527" cy="156" r="2.5" fill="currentColor" stroke="none" />
          </g>
        </>
      );
      break;
    case 2: /* 经纬球 */
      art = (
        <>
          <g {...wire} opacity={0.28}>
            <circle cx="320" cy="180" r="130" />
            <ellipse cx="320" cy="180" rx="130" ry="50" />
            <ellipse cx="320" cy="180" rx="130" ry="95" />
            <ellipse cx="320" cy="180" rx="50" ry="130" />
            <ellipse cx="320" cy="180" rx="95" ry="130" />
            <path d="M190 180 H450" />
          </g>
          <g {...copper}>
            <circle cx="412" cy="88" r="7" />
            <circle cx="412" cy="88" r="2.5" fill="currentColor" stroke="none" />
          </g>
        </>
      );
      break;
    case 3: /* 雷达 */
      art = (
        <>
          <g {...wire} opacity={0.28}>
            <circle cx="320" cy="180" r="140" />
            <circle cx="320" cy="180" r="95" />
            <circle cx="320" cy="180" r="50" />
            <path d="M180 180 H460 M320 40 V320" />
          </g>
          <g {...copper}>
            <path d="M320 180 L418 82" />
            <circle cx="380" cy="120" r="5" fill="currentColor" stroke="none" />
          </g>
        </>
      );
      break;
    case 4: /* 多面体 */
      art = (
        <>
          <g {...wire} opacity={0.28}>
            <circle cx="320" cy="180" r="140" />
            <path d="M320 40 L441 110 L441 250 L320 320 L199 250 L199 110 Z" />
            <path d="M320 40 L320 320 M199 110 L441 250 M441 110 L199 250" />
            <path d="M320 110 L381 215 L259 215 Z" />
          </g>
          <g {...copper}>
            <circle cx="441" cy="110" r="7" />
            <circle cx="441" cy="110" r="2.5" fill="currentColor" stroke="none" />
          </g>
        </>
      );
      break;
    case 5: /* 散点 + 回归线 */
      art = (
        <>
          <g {...wire} opacity={0.28}>
            <path d="M120 300 H540 M120 300 V60" />
            {[
              [170, 250], [210, 225], [250, 238], [290, 200], [330, 192],
              [370, 168], [410, 162], [450, 140], [490, 136],
            ].map(([x, y]) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r="3" />
            ))}
          </g>
          <g {...copper}>
            <path d="M140 265 L520 120" />
            <circle cx="330" cy="192" r="7" />
          </g>
        </>
      );
      break;
    default: /* 6 地层波 */
      art = (
        <>
          <g {...wire} opacity={0.28}>
            <path d="M60 120 C160 100 260 140 360 120 S520 105 580 125" />
            <path d="M60 170 C160 150 260 190 360 170 S520 155 580 175" />
            <path d="M60 220 C160 200 260 240 360 220 S520 205 580 225" />
            <path d="M60 270 C160 250 260 290 360 270 S520 255 580 275" />
          </g>
          <g {...copper}>
            <path d="M360 88 V300" strokeDasharray="4 6" />
            <circle cx="360" cy="220" r="6" fill="currentColor" stroke="none" />
          </g>
        </>
      );
  }

  return (
    <svg viewBox="0 0 640 360" className="w-full h-full text-foreground" aria-hidden="true">
      {art}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   NewsCarousel — 轮播新闻
   左：描边巨号 + 当前标题 + 标题列表 / 右：16:9 线框封面
   ═══════════════════════════════════════════════════════════════ */
export default function NewsCarousel({ category }: { category?: News['category'] }) {
  const items = category ? getNewsByCategory(category) : newsData;

  const [index, setIndex] = useState(0);
  const [leaving, setLeaving] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const elapsedRef = useRef(0);
  const barRef = useRef<HTMLDivElement>(null);
  const prevIndexRef = useRef<number | null>(null);

  /* 6s 自动前进；hover 暂停；rAF 驱动底部进度条 */
  useEffect(() => {
    if (items.length < 2) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      if (!pausedRef.current) {
        elapsedRef.current += now - last;
        const p = Math.min(elapsedRef.current / AUTOPLAY_MS, 1);
        if (barRef.current) barRef.current.style.width = `${p * 100}%`;
        if (p >= 1) {
          elapsedRef.current = 0;
          setIndex((i) => (i + 1) % items.length);
        }
      }
      last = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [items.length]);

  /* 记录离开的旧封面，触发斜向擦除 */
  useEffect(() => {
    const prev = prevIndexRef.current;
    prevIndexRef.current = index;
    if (prev === null || prev === index) return;
    setLeaving(prev);
    const t = window.setTimeout(() => setLeaving(null), WIPE_MS);
    return () => window.clearTimeout(t);
  }, [index]);

  if (items.length === 0) return null;

  const current = items[Math.min(index, items.length - 1)];
  const leavingItem = leaving !== null ? items[leaving] : null;

  function goTo(i: number) {
    if (i === index) return;
    elapsedRef.current = 0;
    if (barRef.current) barRef.current.style.width = '0%';
    setIndex(i);
  }

  function setPause(v: boolean) {
    pausedRef.current = v;
    setPaused(v);
  }

  return (
    <section
      aria-label="最新动态"
      onMouseEnter={() => setPause(true)}
      onMouseLeave={() => setPause(false)}
    >
      <style>{carouselStyles}</style>

      <div className="flex items-center gap-4 mb-10">
        <span className="text-primary" aria-hidden="true">✦</span>
        <h2 className="text-xl font-heading font-semibold text-foreground">最新动态</h2>
        <div className="flex-1 h-px bg-border/40" />
        <span className="label-plate">News</span>
      </div>

      <Link
        to={`/news/${current.id}/`}
        className="group grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-10 lg:gap-14 items-center"
      >
        {/* 左栏：描边序号 + 当前标题 + 列表 */}
        <div className="order-2 lg:order-1 min-w-0">
          <div
            className="text-outline font-heading font-bold leading-none text-7xl md:text-8xl mb-8 select-none"
            aria-hidden="true"
          >
            {String(items.indexOf(current) + 1).padStart(2, '0')}
          </div>

          <div key={`title-${current.id}`} className="news-title-in mb-8">
            <p className="label-plate mb-3">{current.date}</p>
            <h3 className="font-heading text-2xl md:text-3xl font-semibold text-foreground group-hover:text-primary transition-colors duration-500">
              {current.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed line-clamp-3">
              {current.summary}
            </p>
          </div>

          <ul className="border-t border-border/40">
            {items.map((n, i) => {
              const active = n.id === current.id;
              return (
                <li key={n.id} className="border-b border-border/40">
                  <button
                    type="button"
                    aria-current={active}
                    onMouseEnter={() => goTo(i)}
                    onClick={(e) => {
                      e.preventDefault();
                      goTo(i);
                    }}
                    className={`w-full text-left flex items-baseline gap-4 py-3 transition-colors duration-300 ${
                      active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span className="label-plate shrink-0">{n.date}</span>
                    <span className="font-heading text-sm md:text-[15px] font-medium truncate">
                      {n.title}
                    </span>
                    <span
                      className={`ml-auto shrink-0 text-xs transition-opacity duration-300 ${
                        active ? 'opacity-100 text-primary' : 'opacity-0'
                      }`}
                      aria-hidden="true"
                    >
                      →
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* 右栏：16:9 封面，斜向擦除切换 */}
        <div className="order-1 lg:order-2 relative aspect-video overflow-hidden bg-card border border-border">
          <div key={`cover-${current.id}`} className="news-cover-in absolute inset-0 p-8 md:p-12">
            <NewsCover variant={current.coverVariant} />
          </div>
          {leavingItem && (
            <div
              key={`leaving-${leavingItem.id}-to-${current.id}`}
              className="news-cover-out absolute inset-0 p-8 md:p-12 bg-card"
            >
              <NewsCover variant={leavingItem.coverVariant} />
            </div>
          )}
        </div>
      </Link>

      {/* 底部进度条（铜橙） */}
      <div className="mt-6 relative h-px bg-border/40 overflow-hidden">
        <div
          ref={barRef}
          className="absolute left-0 top-0 h-full bg-primary"
          style={{ width: '0%' }}
        />
      </div>
      <span className="sr-only">{paused ? '轮播已暂停' : '轮播进行中'}</span>
    </section>
  );
}
