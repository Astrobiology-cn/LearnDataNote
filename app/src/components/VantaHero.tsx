import { useEffect, useRef, useState } from 'react';

/* ── WebGL availability check ── */
function webglSupported(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl') || canvas.getContext('webgl2'));
  } catch {
    return false;
  }
}

/* ── CSS starfield fallback when WebGL is unavailable ── */
function StarField() {
  return (
    <div
      className="absolute inset-0"
      style={{
        background:
          'radial-gradient(ellipse at 70% 30%, #0c1a30 0%, #030818 60%, #02050d 100%)',
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.2,
          backgroundImage: `
            radial-gradient(1.5px 1.5px at 40px 60px, rgba(255,255,255,0.6), transparent),
            radial-gradient(1px 1px at 120px 140px, rgba(255,255,255,0.5), transparent),
            radial-gradient(1.5px 1.5px at 200px 30px, rgba(255,255,255,0.7), transparent),
            radial-gradient(1px 1px at 300px 40px, rgba(255,255,255,0.6), transparent),
            radial-gradient(1.5px 1.5px at 450px 80px, rgba(255,255,255,0.6), transparent),
            radial-gradient(1px 1px at 600px 50px, rgba(255,255,255,0.7), transparent),
            radial-gradient(1.5px 1.5px at 750px 75px, rgba(255,255,255,0.5), transparent),
            radial-gradient(1px 1px at 900px 55px, rgba(255,255,255,0.6), transparent),
            radial-gradient(1.5px 1.5px at 1050px 35px, rgba(255,255,255,0.5), transparent)
          `,
          backgroundSize: '1100px 180px',
        }}
      />
    </div>
  );
}

export default function VantaHero({ children }: { children: React.ReactNode }) {
  const vantaRef = useRef<{ destroy(): void } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [vantaReady, setVantaReady] = useState(false);
  const [webglAvailable] = useState(() => webglSupported());

  useEffect(() => {
    if (!webglAvailable || !containerRef.current) {
      setVantaReady(true);
      return;
    }

    let cancelled = false;

    async function initVanta() {
      try {
        const [THREE, GLOBEMod] = await Promise.all([
          import('three'),
          import('vanta/dist/vanta.globe.min'),
        ]);

        if (cancelled || !containerRef.current) return;

        const GLOBEFn: any =
          typeof GLOBEMod === 'function' ? GLOBEMod : (GLOBEMod as any).default;

        if (typeof GLOBEFn !== 'function') {
          console.error('[VantaHero] Failed to resolve GLOBE factory');
          setVantaReady(true);
          return;
        }

        try {
          vantaRef.current = GLOBEFn({
            el: containerRef.current,
            THREE,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.0,
            minWidth: 200.0,
            scale: 1.0,
            scaleMobile: 1.0,
            color: 0xa68a58,
            color2: 0x16213e,
            backgroundColor: 0x030818,
            size: 1.4,
          });
        } catch (webglError) {
          console.warn('[VantaHero] WebGL init failed, using CSS fallback:', webglError);
        }
      } catch (importError) {
        console.warn('[VantaHero] Module load failed, using CSS fallback:', importError);
      } finally {
        if (!cancelled) setVantaReady(true);
      }
    }

    initVanta();

    return () => {
      cancelled = true;
      if (vantaRef.current) {
        vantaRef.current.destroy();
        vantaRef.current = null;
      }
    };
  }, [webglAvailable]);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden"
      style={{
        minHeight: '100dvh',
        background:
          vantaReady && !vantaRef.current
            ? 'radial-gradient(ellipse at 70% 30%, #0c1a30 0%, #030818 60%, #02050d 100%)'
            : undefined,
      }}
    >
      {webglAvailable ? null : <StarField />}

      {/* Left-to-right scrim for text readability */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, rgba(3,8,24,0.82) 0%, rgba(3,8,24,0.55) 45%, rgba(3,8,24,0.18) 70%, transparent 100%)',
          zIndex: 1,
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 0%, rgba(3,8,24,0.45) 100%)',
          zIndex: 1,
        }}
      />

      {/* Bottom fade-out gradient */}
      <div
        className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, hsl(var(--background)), transparent)',
          zIndex: 1,
        }}
      />

      {/* Foreground content */}
      <div
        className="relative z-10 min-h-[100dvh] flex flex-col"
        style={{
          opacity: vantaReady ? 1 : 0,
          transition: 'opacity 0.6s ease',
        }}
      >
        {children}
      </div>
    </div>
  );
}
