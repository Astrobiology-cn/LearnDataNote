import { useScrollReveal } from '../animations/useScrollReveal';

/* ── Ink-wash planet line art ── */
function PlanetGlyph() {
  return (
    <svg
      viewBox="0 0 600 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="planet-fill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.06" />
          <stop offset="60%" stopColor="hsl(var(--primary))" stopOpacity="0.02" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>

      {/* Planet body */}
      <circle cx="300" cy="300" r="180" fill="url(#planet-fill)" />
      <circle cx="300" cy="300" r="180" stroke="hsl(var(--primary))" strokeOpacity="0.35" strokeWidth="1.2" />

      {/* Inner detail rings */}
      <circle cx="300" cy="300" r="140" stroke="hsl(var(--foreground))" strokeOpacity="0.08" strokeWidth="0.8" />
      <circle cx="300" cy="300" r="100" stroke="hsl(var(--foreground))" strokeOpacity="0.06" strokeWidth="0.8" />

      {/* Orbit rings */}
      <ellipse cx="300" cy="300" rx="240" ry="90" stroke="hsl(var(--foreground))" strokeOpacity="0.12" strokeWidth="0.8" transform="rotate(-18 300 300)" />
      <ellipse cx="300" cy="300" rx="280" ry="110" stroke="hsl(var(--foreground))" strokeOpacity="0.08" strokeWidth="0.8" transform="rotate(-18 300 300)" />

      {/* Satellite dots */}
      <circle cx="190" cy="190" r="3" fill="hsl(var(--primary))" fillOpacity="0.5" />
      <circle cx="430" cy="180" r="2.5" fill="hsl(var(--primary))" fillOpacity="0.4" />
      <circle cx="150" cy="360" r="2" fill="hsl(var(--foreground))" fillOpacity="0.25" />

      {/* Mountain silhouette suggestion */}
      <path
        d="M180 420 Q 240 380 300 420 T 420 420"
        stroke="hsl(var(--foreground))"
        strokeOpacity="0.12"
        strokeWidth="1"
        fill="none"
      />
    </svg>
  );
}

export default function InkHero({ children }: { children: React.ReactNode }) {
  const revealRef = useScrollReveal<HTMLElement>({ from: 'fade', duration: 0.9 });

  return (
    <section ref={revealRef} className="relative w-full overflow-hidden bg-background" style={{ minHeight: '100dvh' }}>
      {/* Ink-wash background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 70% 25%, hsl(var(--card)) 0%, hsl(var(--background)) 55%, hsl(var(--background)) 100%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-60"
        style={{
          background:
            'radial-gradient(ellipse at 30% 80%, hsl(var(--primary) / 0.08), transparent 50%)',
        }}
      />

      {/* Planet glyph — right side, partially off-canvas */}
      <div className="absolute right-[-10%] top-1/2 -translate-y-1/2 w-[70vw] max-w-[820px] aspect-square pointer-events-none opacity-80">
        <PlanetGlyph />
      </div>

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, hsl(var(--background)), transparent)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 min-h-[100dvh] flex flex-col">
        {children}
      </div>
    </section>
  );
}
