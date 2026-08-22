import { useEffect, useRef } from 'react';

/**
 * Radar — 外部资源 section background.
 *
 * A deep-space tracking station sitting in the empty (right) zone:
 * - Concentric range rings + crosshair, a rotating sweep wedge, and blips
 *   that light up when the sweep passes over them.
 * - Emits a radio pulse every ~4s. Clicking the section fires a pulse too —
 *   the faster you click, the stronger (brighter, double-ringed) the burst.
 * - Tiny distant satellite squadrons occasionally streak across.
 * Listeners attach to the parent <section> (canvas is pointer-events-none).
 * Pauses off-screen; static frame under prefers-reduced-motion.
 */

type Blip = { x: number; y: number; angle: number; litAt: number };
type Wave = { start: number; strength: number };
type Sat = {
  p0: { x: number; y: number };
  p1: { x: number; y: number };
  p2: { x: number; y: number };
  start: number;
  duration: number;
  scale: number;
};

const REDUCED_MOTION =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function bezier(s: Sat, t: number) {
  const u = 1 - t;
  return {
    x: u * u * s.p0.x + 2 * u * t * s.p1.x + t * t * s.p2.x,
    y: u * u * s.p0.y + 2 * u * t * s.p1.y + t * t * s.p2.y,
  };
}

export default function DataGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const host = canvas.parentElement ?? canvas;

    let animationId = 0;
    let running = false;
    let blips: Blip[] = [];
    let waves: Wave[] = [];
    let sats: Sat[] = [];
    let clickTimes: number[] = [];
    let nextAutoWave = 0;
    let nextFleet = 0;
    let cx = 0;
    let cy = 0;
    let R = 0;

    function resize() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      cx = canvas.width * 0.72;
      cy = canvas.height * 0.52;
      R = Math.min(canvas.width, canvas.height) * 0.36;
      if (blips.length === 0) {
        for (let i = 0; i < 9; i++) {
          const a = Math.random() * Math.PI * 2;
          const r = R * (0.25 + Math.random() * 0.7);
          blips.push({
            x: Math.cos(a) * r,
            y: Math.sin(a) * r,
            angle: a,
            litAt: -9999,
          });
        }
      }
    }
    resize();
    window.addEventListener('resize', resize);

    function onClick() {
      const now = performance.now();
      clickTimes = clickTimes.filter((t) => now - t < 1500);
      clickTimes.push(now);
      // Click frequency drives burst strength: 0.5 baseline, +0.15 per rapid click
      const strength = Math.min(0.5 + (clickTimes.length - 1) * 0.15, 1.4);
      waves.push({ start: now, strength });
    }
    host.addEventListener('click', onClick);

    function draw(now: number, animate: boolean) {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const isDark = document.documentElement.classList.contains('dark');
      const ink = isDark ? '176, 141, 87' : '139, 109, 63'; // brass
      const inkSoft = isDark ? '232, 228, 220' : '26, 28, 34';

      /* ── Range rings + crosshair ── */
      ctx.strokeStyle = `rgba(${ink}, 1)`;
      ctx.lineWidth = 1;
      for (let i = 1; i <= 3; i++) {
        ctx.globalAlpha = 0.14;
        ctx.beginPath();
        ctx.arc(cx, cy, (R * i) / 3, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 0.1;
      ctx.beginPath();
      ctx.moveTo(cx - R, cy);
      ctx.lineTo(cx + R, cy);
      ctx.moveTo(cx, cy - R);
      ctx.lineTo(cx, cy + R);
      ctx.stroke();
      // Tick marks on the outer ring
      ctx.globalAlpha = 0.16;
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * (R - 5), cy + Math.sin(a) * (R - 5));
        ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
        ctx.stroke();
      }

      /* ── Rotating sweep wedge (trailing gradient) ── */
      const sweep = animate ? now * 0.0006 : 0.8;
      for (let i = 0; i < 28; i++) {
        const a0 = sweep - i * 0.022 - 0.022;
        const a1 = sweep - i * 0.022;
        ctx.globalAlpha = 0.09 * (1 - i / 28);
        ctx.fillStyle = `rgba(${ink}, 1)`;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, R, a0, a1);
        ctx.closePath();
        ctx.fill();
      }
      // Leading edge line
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = `rgba(${ink}, 1)`;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(sweep) * R, cy + Math.sin(sweep) * R);
      ctx.stroke();

      /* ── Blips: light when the sweep passes, then fade ── */
      for (const b of blips) {
        if (animate) {
          // Normalize angle difference to [0, 2π)
          const diff = (sweep - b.angle) % (Math.PI * 2);
          if (diff > 0 && diff < 0.05 && now - b.litAt > 3000) b.litAt = now;
        }
        const age = now - b.litAt;
        const glow = Math.max(0, 1 - age / 2500);
        if (glow > 0) {
          ctx.fillStyle = `rgba(${inkSoft}, ${(glow * 0.85).toFixed(3)})`;
          ctx.globalAlpha = 1;
          ctx.beginPath();
          ctx.arc(cx + b.x, cy + b.y, 2.5 + glow * 1.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = `rgba(${ink}, ${(glow * 0.25).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(cx + b.x, cy + b.y, 6 + glow * 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      /* ── Radio pulses: auto every ~4s + click bursts ── */
      if (animate && now > nextAutoWave) {
        waves.push({ start: now, strength: 0.45 });
        nextAutoWave = now + 3800 + Math.random() * 1200;
      }
      waves = waves.filter((w) => now - w.start < 2200);
      for (const w of waves) {
        const t = (now - w.start) / 2200;
        const r = t * R * 1.6;
        const alpha = (1 - t) * 0.45 * w.strength;
        ctx.strokeStyle = `rgba(${ink}, 1)`;
        ctx.globalAlpha = Math.max(alpha, 0);
        ctx.lineWidth = 1.2 + w.strength;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
        // Strong bursts get a trailing second ring
        if (w.strength > 0.8) {
          ctx.globalAlpha = Math.max(alpha * 0.6, 0);
          ctx.beginPath();
          ctx.arc(cx, cy, r * 0.85, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      /* ── Distant satellite squadrons ── */
      if (animate && now > nextFleet) {
        const w = canvas.width;
        const h = canvas.height;
        const count = 2 + Math.floor(Math.random() * 3);
        const baseY = h * (0.15 + Math.random() * 0.6);
        for (let i = 0; i < count; i++) {
          sats.push({
            p0: { x: w + 20 + Math.random() * 60, y: baseY + (Math.random() - 0.5) * 50 },
            p1: { x: w * 0.5, y: baseY - h * 0.22 },
            p2: { x: -30 - Math.random() * 40, y: baseY + (Math.random() - 0.5) * 60 },
            start: now + i * (140 + Math.random() * 80),
            duration: 4200 + Math.random() * 1500,
            scale: 0.5 + Math.random() * 0.3,
          });
        }
        nextFleet = now + 22000 + Math.random() * 16000;
      }
      sats = sats.filter((s) => now - s.start < s.duration + 200);
      for (const s of sats) {
        const raw = (now - s.start) / s.duration;
        if (raw < 0) continue;
        const t = 1 - Math.pow(1 - Math.min(raw, 1), 2.8);
        const pos = bezier(s, t);
        const ahead = bezier(s, Math.min(t + 0.01, 1));
        const angle = Math.atan2(ahead.y - pos.y, ahead.x - pos.x);
        const fade = Math.min(raw * 6, 1, (1 - raw) * 6);
        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.rotate(angle);
        ctx.scale(s.scale, s.scale);
        ctx.globalAlpha = Math.max(fade, 0) * 0.3;
        ctx.fillStyle = `rgba(${inkSoft}, 1)`;
        ctx.fillRect(-3, -2, 6, 4);
        ctx.fillRect(-6, -0.75, 3, 1.5);
        ctx.fillRect(3, -0.75, 3, 1.5);
        ctx.restore();
      }

      ctx.globalAlpha = 1;
    }

    function frame(now: number) {
      if (!running) return;
      draw(now, true);
      animationId = requestAnimationFrame(frame);
    }

    const cleanup: Array<() => void> = [];

    if (REDUCED_MOTION) {
      draw(0, false);
    } else {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !running) {
            running = true;
            nextAutoWave = performance.now() + 800;
            nextFleet = performance.now() + 5000;
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
      window.removeEventListener('resize', resize);
      host.removeEventListener('click', onClick);
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
