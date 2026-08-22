import { Suspense, lazy, useState, useEffect } from 'react';

const PlanetCanvas = lazy(() => import('./PlanetCanvas'));

import { useIsDark } from '../hooks/useIsDark';

const REDUCED_MOTION =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── Static gradient fallback (WebGL unavailable / reduced motion) ── */
function StaticHero({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative w-full overflow-hidden bg-background"
      style={{ minHeight: '100dvh' }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 40%, hsl(var(--card)) 0%, hsl(var(--background)) 55%, hsl(var(--background)) 100%)',
        }}
      />
      <div className="relative z-10 min-h-[100dvh] flex flex-col">
        {children}
      </div>
    </div>
  );
}

/* ── Main 3D Hero component ── */
export default function PlanetHero({
  children,
  ...props
}: { children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [webglAvailable, setWebglAvailable] = useState(true);
  const isDark = useIsDark();

  useEffect(() => {
    // Check WebGL support
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
      if (!gl) setWebglAvailable(false);
    } catch {
      setWebglAvailable(false);
    }

    // Scroll listener for camera rig
    // R3：进度铺满整个 Hero 滚出区间（/vh，原为 /0.8vh）——行星幽灵圆环的
    // 淡化与相机 dolly 随 Hero 离屏同步完成，不再提前 0.2 屏留出死区
    function onScroll() {
      const scrollY = window.scrollY;
      const vh = window.innerHeight;
      const progress = Math.min(scrollY / vh, 1);
      setScrollProgress(progress);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!webglAvailable || REDUCED_MOTION) {
    return <StaticHero>{children}</StaticHero>;
  }

  return (
    <div
      className="relative w-full overflow-hidden bg-background"
      style={{ minHeight: '100dvh' }}
      {...props}
    >
      {/* 3D Canvas (code-split, loads after first paint) */}
      <div className="absolute inset-0 z-0">
        <Suspense fallback={null}>
          <PlanetCanvas scrollProgress={scrollProgress} />
        </Suspense>
      </div>

      {/* Readability scrim behind the centered wordmark */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, hsl(var(--background) / 0.45) 0%, transparent 55%)',
        }}
      />

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 z-[1] pointer-events-none"
        style={{
          background: 'linear-gradient(to top, hsl(var(--background)), transparent)',
        }}
      />

      {/* 底部弧光收口（卷一叙事「星球淡出为幽微光环、底部极淡弧光收口」）：
          滚动后段淡入的铜橙弧光，填充 Hero 下半场的视觉空带，随后随 section
          一起滚出，把视线交棒给自纵深飞来的火箭。
          椭圆心贴在 Hero 底缘稍下（112%），只让弧光上缘漫进画面。
          R4：浅色模式 alpha 0.13→0.28、淡入起点 0.3→0.2——羊皮纸上 13% 的铜橙
          几乎不可见（R3 盲测「整张空白纸」的主因之一），浅色需更高浓度才读得出；
          深色维持 0.13 不变 */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 right-0 z-[1] pointer-events-none"
        style={{
          height: '55%',
          background: `radial-gradient(ellipse 90% 78% at 50% 112%, hsl(var(--primary) / ${isDark ? 0.13 : 0.28}) 0%, transparent 65%)`,
          opacity: Math.min(Math.max((scrollProgress - 0.2) / 0.55, 0), 1),
        }}
      />

      {/* Content */}
      <div className="relative z-10 min-h-[100dvh] flex flex-col">
        {children}
      </div>
    </div>
  );
}
