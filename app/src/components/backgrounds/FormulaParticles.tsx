import { useEffect, useRef } from 'react';

/**
 * FormulaRain — p5-animation "rainCurtain" internalized for 学科知识.
 *
 * - Zoned density: sparse & faint behind the text (left), dense & brighter
 *   in the empty zone (right) — the motion frames the content instead of
 *   competing with it.
 * - Organic brush: threads are pushed by a gaussian falloff weighted by
 *   cursor speed, and spring back with damped velocity (no rigid lerp).
 * - Occasional fast "drops" — single bright symbols that plummet through
 *   the curtain like raindrops between the threads.
 * Listeners attach to the parent <section> (canvas is pointer-events-none).
 * Pauses off-screen; static frame under prefers-reduced-motion.
 */

const SYMBOLS = ['∂', '∇', '∫', 'π', 'λ', 'μ', 'σ', 'φ', 'ω', '∞', '√', '∑', 'Δ', 'θ'];

type Thread = {
  x: number;
  offset: number; // brush displacement
  vel: number; // spring velocity for organic rebound
  zone: number; // 0.35 (text zone) – 1 (empty zone), scales alpha
  y: number;
  speed: number;
  phase: number;
  symbols: string[];
};

type Drop = { x: number; y: number; speed: number; symbol: string };

const TRAIL = 7;
const REDUCED_MOTION =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function pickSymbol() {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}

export default function FormulaParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const host = canvas.parentElement ?? canvas;

    let animationId = 0;
    let running = false;
    let threads: Thread[] = [];
    let drops: Drop[] = [];
    let nextDrop = 0;
    const mouse = { x: -9999, y: -9999, px: -9999, speed: 0 };

    function build() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      threads = [];
      let x = 30;
      while (x < canvas.width) {
        // Text occupies the left ~45%: thin out and fade there
        const inTextZone = x < canvas.width * 0.45;
        threads.push({
          x,
          offset: 0,
          vel: 0,
          zone: inTextZone ? 0.35 : 1,
          y: Math.random() * canvas.height,
          speed: 0.4 + Math.random() * 0.7,
          phase: Math.random() * Math.PI * 2,
          symbols: Array.from({ length: TRAIL }, pickSymbol),
        });
        x += inTextZone ? 86 : 44; // sparse left, dense right
      }
    }
    build();
    window.addEventListener('resize', build);

    function onMouseMove(e: MouseEvent) {
      const rect = canvas?.getBoundingClientRect();
      if (!rect) return;
      const nx = e.clientX - rect.left;
      mouse.speed = Math.min(Math.abs(nx - mouse.px) * 0.15, 3); // cursor velocity
      mouse.px = nx;
      mouse.x = nx;
      mouse.y = e.clientY - rect.top;
    }
    function onMouseLeave() {
      mouse.x = -9999;
      mouse.y = -9999;
      mouse.px = -9999;
      mouse.speed = 0;
    }
    host.addEventListener('mousemove', onMouseMove);
    host.addEventListener('mouseleave', onMouseLeave);

    function draw(time: number, animate: boolean) {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const isDark = document.documentElement.classList.contains('dark');
      ctx.fillStyle = isDark ? 'rgba(232, 228, 220, 1)' : 'rgba(26, 28, 34, 1)';
      ctx.textAlign = 'center';

      // Spawn fast drops in the dense zone
      if (animate && time > nextDrop) {
        drops.push({
          x: canvas.width * (0.5 + Math.random() * 0.45),
          y: -20,
          speed: 2.6 + Math.random() * 2.2,
          symbol: pickSymbol(),
        });
        nextDrop = time + 1600 + Math.random() * 2200;
      }
      drops = drops.filter((d) => d.y < canvas.height + 30);

      for (const t of threads) {
        // ── Organic brush: gaussian falloff × cursor speed, spring rebound ──
        const dx = t.x + t.offset - mouse.x;
        const dy = t.y - mouse.y;
        const g = Math.exp(-((dx * dx + dy * dy * 0.25) / (2 * 110 * 110)));
        const target = animate ? Math.sign(dx || 1) * g * (26 + mouse.speed * 14) : 0;
        t.vel += (target - t.offset) * 0.05;
        t.vel *= 0.9; // damping → slight overshoot, alive not rigid
        t.offset += t.vel;

        if (animate) {
          t.y += t.speed * (0.7 + 0.3 * Math.sin(time * 0.0004 + t.phase));
          if (t.y - TRAIL * 22 > canvas.height) {
            t.y = -10;
            t.symbols = Array.from({ length: TRAIL }, pickSymbol);
          }
        }

        // Layered sway: slow drift + quicker shimmer
        const sway =
          Math.sin(time * 0.0006 + t.phase) * 5 +
          Math.sin(time * 0.0017 + t.phase * 2.3) * 2;
        const x = t.x + t.offset + sway;

        for (let i = 0; i < TRAIL; i++) {
          const k = 1 - i / TRAIL; // head brightest
          ctx.globalAlpha = ((isDark ? 0.17 : 0.12) * k * k + 0.02) * t.zone;
          ctx.font = `${13 + k * 8}px serif`;
          ctx.fillText(t.symbols[i], x, t.y - i * 22);
        }
      }

      // Fast drops: bright head + short trail
      for (const d of drops) {
        if (animate) d.y += d.speed;
        for (let i = 0; i < 4; i++) {
          const k = 1 - i / 4;
          ctx.globalAlpha = (isDark ? 0.34 : 0.24) * k * k;
          ctx.font = `${11 + k * 6}px serif`;
          ctx.fillText(d.symbol, d.x, d.y - i * 16);
        }
      }

      ctx.globalAlpha = 1;
    }

    function frame(time: number) {
      if (!running) return;
      draw(time, true);
      animationId = requestAnimationFrame(frame);
    }

    const cleanup: Array<() => void> = [];

    if (REDUCED_MOTION) {
      draw(0, false); // single static frame
    } else {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !running) {
            running = true;
            animationId = requestAnimationFrame(frame);
          } else if (!entry.isIntersecting && running) {
            running = false;
            cancelAnimationFrame(animationId);
          }
        },
        { threshold: 0.05 },
      );
      observer.observe(canvas);
      cleanup.push(() => observer.disconnect());
    }

    return () => {
      running = false;
      cancelAnimationFrame(animationId);
      cleanup.forEach((fn) => fn());
      window.removeEventListener('resize', build);
      host.removeEventListener('mousemove', onMouseMove);
      host.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  );
}
