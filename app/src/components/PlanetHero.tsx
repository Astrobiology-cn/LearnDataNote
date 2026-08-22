import { Suspense, lazy, useState, useEffect } from 'react';

const PlanetCanvas = lazy(() => import('./PlanetCanvas'));

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
    function onScroll() {
      const scrollY = window.scrollY;
      const vh = window.innerHeight;
      const progress = Math.min(scrollY / (vh * 0.8), 1);
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

      {/* Content */}
      <div className="relative z-10 min-h-[100dvh] flex flex-col">
        {children}
      </div>
    </div>
  );
}
