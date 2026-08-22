import { useEffect, useRef } from 'react';
import { hslVarToRgb } from '../lib/canvasTheme';

/**
 * SharedSpaceBackground — 贯穿全页的共享背景层（Sanctuary 双模式）。
 *
 * 这是首页六幕"叙事断裂"问题的结构性修复：此前每幕各自绘制背景，彼此无承接。
 * 本组件在视口固定一层 canvas，深色模式渲染星场 + 极淡铜橙星云，浅色模式渲染
 * 墨点星图（羊皮纸感），两模式均通过 CSS 变量取色，主题切换时实时重取并重绘。
 *
 * 设计要点（对应提示词第十节）：
 *  - 颜色由 getComputedStyle 读取 --background/--foreground/--primary/--muted-foreground
 *    （hslVarToRgb 见 lib/canvasTheme.ts），绝不写死十六进制；主题切换（<html> 的
 *    .dark class 变化）经 MutationObserver 重取。
 *  - 铜橙 #EA6D15（--primary）两模式恒定，仅作极低不透明度的星云/微光点缀。
 *  - 支持滚动视差（星点随 scrollY 缓慢上移），prefers-reduced-motion 时只绘一帧静态，
 *    标签页隐藏时暂停 rAF。
 */

type Scene = {
  isDark: boolean;
  fg: string; // 前景色（深：白；浅：深蓝墨）
  primary: string; // 铜橙
  muted: string; // 辅助文字色
};

type Star = {
  x: number; // 0..1 相对视口宽
  y: number; // 0..1 相对视口高（含视差余量）
  r: number;
  base: number; // 基础亮度 0..1
  tw: number; // 闪烁速度
  ph: number; // 闪烁相位
};

export default function SharedSpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let W = 0;
    let H = 0;
    let dpr = 1;
    let scene: Scene = { isDark: true, fg: '#fff', primary: '#EA6D15', muted: '#4E566B' };
    let stars: Star[] = [];
    let rafId = 0;
    let running = false;
    let scrollY = 0;

    function refreshColors() {
      const cs = getComputedStyle(document.documentElement);
      const isDark = document.documentElement.classList.contains('dark');
      scene = {
        isDark,
        fg: hslVarToRgb(cs.getPropertyValue('--foreground') || '0 0% 100%'),
        primary: hslVarToRgb(cs.getPropertyValue('--primary') || '25 84% 50%'),
        muted: hslVarToRgb(cs.getPropertyValue('--muted-foreground') || '224 17% 42%'),
      };
    }

    function buildStars() {
      // R4：密度 /9000→/7000（浅色星图偏稀是盲测「空白纸」观感的帮凶）
      const count = Math.max(160, Math.min(360, Math.floor((W * H) / 7000)));
      stars = Array.from({ length: count }, () => ({
        x: Math.random(),
        y: Math.random() * 1.15, // 预留视差余量
        r: 0.5 + Math.random() * 1.4,
        base: 0.25 + Math.random() * 0.7,
        tw: 0.4 + Math.random() * 1.6,
        ph: Math.random() * Math.PI * 2,
      }));
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas!.width = Math.floor(W * dpr);
      canvas!.height = Math.floor(H * dpr);
      canvas!.style.width = `${W}px`;
      canvas!.style.height = `${H}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildStars();
    }

    function drawNebula() {
      if (!ctx) return;
      // 仅深色模式叠极淡铜橙星云，浅色模式保持羊皮纸干净
      if (!scene.isDark) return;
      const blobs = [
        { x: W * 0.2, y: H * 0.3, r: Math.max(W, H) * 0.4 },
        { x: W * 0.82, y: H * 0.7, r: Math.max(W, H) * 0.35 },
      ];
      for (const b of blobs) {
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        g.addColorStop(0, scene.primary.replace('rgb(', 'rgba(').replace(')', ',0.05)'));
        g.addColorStop(1, scene.primary.replace('rgb(', 'rgba(').replace(')', ',0)'));
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }
    }

    function draw(now: number, animate: boolean) {
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);
      drawNebula();

      // 滚动视差：星点整体随 scrollY 缓慢上移（取模回绕）
      const par = (scrollY * 0.04) % H;
      for (const s of stars) {
        let y = s.y * H - par;
        y = ((y % (H * 1.15)) + H * 1.15) % (H * 1.15);
        const x = s.x * W;
        const tw = animate ? 0.55 + 0.45 * Math.sin(now * 0.001 * s.tw + s.ph) : 1;
        const a = s.base * tw;
        // 浅色模式压低整体亮度，避免"纸上过曝"
        // R4：0.5→0.68（0.5 在羊皮纸上稀到近乎不可见，盲测误判"页面坏了"）
        const alpha = scene.isDark ? a : a * 0.68;
        ctx.beginPath();
        ctx.fillStyle = scene.fg;
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        ctx.arc(x, y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function frame(now: number) {
      if (!running) return;
      draw(now, true);
      rafId = requestAnimationFrame(frame);
    }

    function start() {
      if (running) return;
      running = true;
      rafId = requestAnimationFrame(frame);
    }
    function stop() {
      running = false;
      cancelAnimationFrame(rafId);
    }

    /* ── 初始化 ─────────────────────────────── */
    refreshColors();
    resize();

    const onScroll = () => {
      scrollY = window.scrollY || window.pageYOffset || 0;
    };
    const onResize = () => resize();
    const onVisibility = () => {
      if (document.hidden) stop();
      else if (!reduced) start();
    };
    const onThemeChange = () => {
      refreshColors();
      if (reduced) draw(0, false);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibility);
    const mo = new MutationObserver(onThemeChange);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    if (reduced) {
      draw(0, false);
    } else {
      start();
    }

    return () => {
      stop();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      mo.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
