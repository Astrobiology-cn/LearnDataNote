import { useEffect, useRef } from 'react';

/**
 * Meteors — p5-animation "swallow" internalized for the space theme.
 * A meteor streaks along a quadratic-bezier arc (upper-right → lower-left)
 * with eased progress and a fading polyline trail. Spawns every 6–12s,
 * occasionally a staggered pair. Rendered in the hero's right "active zone"
 * so it never crosses the text safe zone.
 */

type Meteor = {
  p0: { x: number; y: number };
  p1: { x: number; y: number };
  p2: { x: number; y: number };
  start: number;
  duration: number;
  trail: Array<{ x: number; y: number }>;
};

const TRAIL_LEN = 26;
const REDUCED_MOTION =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function bezier(m: Meteor, t: number) {
  const u = 1 - t;
  return {
    x: u * u * m.p0.x + 2 * u * t * m.p1.x + t * t * m.p2.x,
    y: u * u * m.p0.y + 2 * u * t * m.p1.y + t * t * m.p2.y,
  };
}

export default function Meteors() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (REDUCED_MOTION) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId = 0;
    let running = false;
    let meteors: Meteor[] = [];
    let nextSpawn = performance.now() + 1500;

    function resize() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function spawn(now: number) {
      if (!canvas) return;
      const w = canvas.width;
      const h = canvas.height;
      const make = (delay: number): Meteor => ({
        // Enter from upper-right edge, exit lower-left edge
        p0: { x: w * (0.55 + Math.random() * 0.5), y: -20 },
        p1: { x: w * (0.35 + Math.random() * 0.35), y: h * (0.2 + Math.random() * 0.3) },
        p2: { x: -20, y: h * (0.55 + Math.random() * 0.4) },
        start: now + delay,
        duration: 1300 + Math.random() * 900,
        trail: [],
      });
      meteors.push(make(0));
      // 20% chance of a staggered companion (swallow-style pair)
      if (Math.random() < 0.2) meteors.push(make(140 + Math.random() * 120));
      nextSpawn = now + 6000 + Math.random() * 6000;
    }

    function frame(now: number) {
      if (!running || !ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (now >= nextSpawn) spawn(now);

      const isDark = document.documentElement.classList.contains('dark');
      const head = isDark ? 'rgba(232, 228, 220,' : 'rgba(139, 109, 63,';

      meteors = meteors.filter((m) => now - m.start < m.duration + 100);

      for (const m of meteors) {
        const raw = (now - m.start) / m.duration;
        if (raw < 0) continue;
        const t = Math.min(raw, 1);
        const eased = t * t * (3 - 2 * t); // smoothstep ease

        const pos = bezier(m, eased);
        m.trail.push(pos);
        if (m.trail.length > TRAIL_LEN) m.trail.shift();

        // Trail: fading, tapering polyline
        for (let i = 1; i < m.trail.length; i++) {
          const k = i / m.trail.length;
          ctx.strokeStyle = `${head} ${(k * k * 0.55).toFixed(3)})`;
          ctx.lineWidth = 0.4 + k * 1.6;
          ctx.beginPath();
          ctx.moveTo(m.trail[i - 1].x, m.trail[i - 1].y);
          ctx.lineTo(m.trail[i].x, m.trail[i].y);
          ctx.stroke();
        }

        // Head glow
        if (t < 1) {
          ctx.fillStyle = `${head} 0.9)`;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationId = requestAnimationFrame(frame);
    }

    // Pause when off-screen
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !running) {
          running = true;
          nextSpawn = performance.now() + 800;
          animationId = requestAnimationFrame(frame);
        } else if (!entry.isIntersecting && running) {
          running = false;
          cancelAnimationFrame(animationId);
        }
      },
      { threshold: 0.05 },
    );
    observer.observe(canvas);

    return () => {
      running = false;
      cancelAnimationFrame(animationId);
      observer.disconnect();
      window.removeEventListener('resize', resize);
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
