import { useEffect, useRef } from 'react';

/**
 * StarChart — 学者信息 section background.
 *
 * A living scholar network:
 * - 70 drifting stars, each twinkling on its own phase; rare random flares
 *   make individual stars suddenly shine then decay.
 * - Cursor proximity enlarges and warms stars (brass highlight + glow),
 *   and links them into a local constellation around the pointer.
 * Listeners attach to the parent <section> (canvas is pointer-events-none).
 * Pauses off-screen; static frame under prefers-reduced-motion.
 */

type Star = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  phase: number; // twinkle phase
  tw: number; // twinkle speed
  flare: number; // 0..1 random bright flash, decays
};

const STAR_COUNT = 70;
const REDUCED_MOTION =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function Constellation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const host = canvas.parentElement ?? canvas;

    let animationId = 0;
    let running = false;
    const stars: Star[] = [];
    const mouse = { x: -1000, y: -1000 };

    function resize() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      if (stars.length === 0) {
        for (let i = 0; i < STAR_COUNT; i++) {
          stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.14,
            vy: (Math.random() - 0.5) * 0.1,
            r: 0.8 + Math.random() * 2.2,
            phase: Math.random() * Math.PI * 2,
            tw: 0.6 + Math.random() * 1.6,
            flare: 0,
          });
        }
      }
    }
    resize();
    window.addEventListener('resize', resize);

    function onMouseMove(e: MouseEvent) {
      const rect = canvas?.getBoundingClientRect();
      if (!rect) return;
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    }
    function onMouseLeave() {
      mouse.x = -1000;
      mouse.y = -1000;
    }
    host.addEventListener('mousemove', onMouseMove);
    host.addEventListener('mouseleave', onMouseLeave);

    function draw(time: number, animate: boolean) {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const isDark = document.documentElement.classList.contains('dark');
      const baseStar = isDark ? '232, 228, 220' : '26, 28, 34';
      const warmStar = isDark ? '226, 201, 150' : '139, 109, 63';
      const lineRgb = isDark ? '176, 141, 87' : '139, 109, 63';

      for (const s of stars) {
        if (animate) {
          // Drift + wrap
          s.x += s.vx;
          s.y += s.vy;
          if (s.x < -10) s.x = canvas.width + 10;
          if (s.x > canvas.width + 10) s.x = -10;
          if (s.y < -10) s.y = canvas.height + 10;
          if (s.y > canvas.height + 10) s.y = -10;
          // Random flare ignition + decay
          if (Math.random() < 0.0006) s.flare = 1;
          s.flare *= 0.975;
        }

        const dm = Math.hypot(s.x - mouse.x, s.y - mouse.y);
        const near = Math.max(0, 1 - dm / 170); // 0..1 cursor proximity

        // Twinkle + flare + proximity boost
        const twinkle = animate ? 0.22 + 0.16 * Math.sin(time * 0.001 * s.tw + s.phase) : 0.28;
        const alpha = Math.min(twinkle + s.flare * 0.55 + near * 0.5, 1);
        const radius = s.r * (1 + near * 1.4 + s.flare * 0.5);

        // Star body: warms up near the cursor
        ctx.fillStyle = `rgba(${near > 0.15 || s.flare > 0.3 ? warmStar : baseStar}, ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Glow halo when highlighted
        if (near > 0.15 || s.flare > 0.3) {
          ctx.fillStyle = `rgba(${warmStar}, ${(near * 0.16 + s.flare * 0.12).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, radius * 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Constellation web between nearby stars
      ctx.strokeStyle = `rgba(${lineRgb}, 1)`;
      ctx.lineWidth = 0.7;
      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          const dx = stars[i].x - stars[j].x;
          const dy = stars[i].y - stars[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            ctx.globalAlpha = (1 - dist / 130) * (isDark ? 0.2 : 0.14);
            ctx.beginPath();
            ctx.moveTo(stars[i].x, stars[i].y);
            ctx.lineTo(stars[j].x, stars[j].y);
            ctx.stroke();
          }
        }
      }

      // Cursor constellation: brighter links radiating from the pointer
      for (const s of stars) {
        const dist = Math.hypot(s.x - mouse.x, s.y - mouse.y);
        if (dist < 170) {
          ctx.globalAlpha = 0.55 * (1 - dist / 170);
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
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
      draw(0, false);
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
      window.removeEventListener('resize', resize);
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
