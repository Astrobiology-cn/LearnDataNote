import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { drawRocketLineArt } from './backgrounds/scenes/rocketLineArt';
import { readCanvasTheme, observeCanvasTheme } from '../lib/canvasTheme';

gsap.registerPlugin(ScrollTrigger);

/**
 * RocketManifesto — 首页宣言区：实心宣言排印于 3D 线框火箭下方。
 *
 * 火箭为参数化 3D 线框（rocketLineArt.ts，点/边集合 + 弱透视投影 s=F/(F+z)，
 * 只描边三档线宽/透明度，铜橙仅腹部一道环带），机头朝 +x，支持绕纵轴进动、
 * 偏航（入/离场机头转入/转出纵深）与俯仰（tilt 真三维旋转）。尾焰为铜橙渐变
 * （#EA6D15 → 透明），长度随滚动速度（含 z 向）变化、停靠熄灭。宣言为 HTML
 * 浮层（Noto Serif SC、实心前景色，停靠时位于火箭下方安全区），Our Mission
 * 铭牌维持 HTML。
 *
 * 滚动叙事（ScrollTrigger scrub，start 'top bottom' → end 'bottom top'，双向可逆）：
 * - 进入段（t<0.38）：火箭自 Hero 行星末态屏位（0.5W, 0.40H）后方的真 z 深度
 *   飞出——起点 z 大（透视缩放 ≈0.16）、alpha 自 u≈0.02 即起沿 E-FADE 淡入
 *   （R3 前提显影：消除 Hero 收场与火箭显影之间的空带），随 smoothstep 缓动
 *   向观察者飞近（z→0），缩放由投影 1/z 天然给出（无幂次假透视）；
 *   机头偏航朝向观察者，随停靠转正；
 * - 停靠段（0.38–0.62）：悬停 0.45H（sin ±4px 微浮动），宣言浮层淡入，
 *   Our Mission 铭牌同步（略错峰）淡入；
 * - 离场段（t>0.62）：z 增大远去（透视缩回小点）、alpha→0 消失，机头转入纵深，
 *   宣言/铭牌随离场淡出。
 * 淡化走 E-FADE cubic-bezier(0.455,0.03,0.515,0.955)。尾焰长度只看滚动速度。
 *
 * 构图（R3 盲测修复）：火箭基准 L 再放大（min(0.72W, 1.12H)），宣言字号放大
 * 至 clamp(18px, 1.5vw+9px, 38px)，整幕垂直三段（铭牌 top-24 / 舟 0.45H /
 * 宣言 0.75H）饱满庄重；极扁视口（H<520）宣言下移 0.80H 并收 lineHeight 1.55、
 * 铭牌上移 6%，避免与尾翼相触。宣言为实心前景色排印（R2 起自舟腹移至下方
 * 安全区——镂空叠压舟腹的读感在盲测中被判定不可读，故让位可读性）。
 *
 * 取色走 CSS 变量（lib/canvasTheme.ts：getComputedStyle 读取 + MutationObserver
 * 监听 .dark 切换重取重绘）；IntersectionObserver 离屏暂停 rAF（迟滞阈值 0.1）；
 * prefers-reduced-motion：静态绘制一帧
 * 停靠中央的清晰火箭（宣言/铭牌常显）。
 */

/** 宣言按语义断为两行，每行 11 字 */
const LINE_1 = '系统化行星科学知识体系';
const LINE_2 = '连接知识、学者与工具。';

/** E-FADE — 与设计 tokens 中 --ease-fade 一致 */
const E_FADE = cubicBezierEasing(0.455, 0.03, 0.515, 0.955);

const REDUCED_MOTION =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

function smooth(t: number) {
  const k = clamp01(t);
  return k * k * (3 - 2 * k);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** cubic-bezier(x1,y1,x2,y2) 求值器 */
function cubicBezierEasing(x1: number, y1: number, x2: number, y2: number) {
  const ax = 3 * x1 - 3 * x2 + 1;
  const bx = 3 * x2 - 6 * x1;
  const cx = 3 * x1;
  const ay = 3 * y1 - 3 * y2 + 1;
  const by = 3 * y2 - 6 * y1;
  const cy = 3 * y1;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sy = (t: number) => ((ay * t + by) * t + cy) * t;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 10; i++) {
      const err = sx(t) - x;
      if (Math.abs(err) < 1e-4) break;
      const d = (3 * ax * t + 2 * bx) * t + cx;
      if (Math.abs(d) < 1e-6) break;
      t -= err / d;
    }
    return sy(clamp01(t));
  };
}

type Pose = { x: number; y: number; z: number; alpha: number; dock: number };

const Z_SCALE = 0.16; // 远端透视缩放（完全由 z 深度的投影 1/z 给出；R3 自 0.06 上调，显影前提后远端不再缩成不可见的点）

/**
 * 滚动进度 → 火箭位姿：z 深度远点逼近 → 中段停靠（z=0）→ z 增大远去消失。
 * 位置/深度走 smoothstep（两端导数为 0，远慢近快、到位刹停），缩放不再用
 * 幂次假透视——投影 s=F/(F+z) 天然给出远小近大；淡化走 E-FADE。
 */
function pose(t: number, W: number, H: number, F: number): Pose {
  const IN = 0.38;
  const OUT = 0.62;
  const Z_FAR = F * (1 / Z_SCALE - 1);
  if (t < IN) {
    // 「从星球背后飞出」：起点锚定 Hero 行星末态屏位（0.5W, 0.40H）后方的
    // 真 z 深度（缩放 ≈0.16），alpha 自 u≈0.02 即起淡入（R3 显影前提，消灭
    // Hero 收场后的空带），随后 z→0 向观察者飞近放大，机头偏航朝向观察者、
    // 随停靠转正。
    const u = clamp01(t / IN);
    const s = smooth(u);
    return {
      x: W * 0.5,
      y: lerp(H * 0.4, H * 0.45, s),
      z: Z_FAR * (1 - s),
      alpha: E_FADE(clamp01((u - 0.02) / 0.3)),
      dock: smooth((t - (IN - 0.06)) / 0.06),
    };
  }
  if (t > OUT) {
    // 离场段：位置/深度走 smoothstep（起步缓、随后加速远离），缩放由 z 投影
    // 天然前载——t≈0.79（section 滚出前）z 已过半程，视觉缩到 ≈0.11
    const v = clamp01((t - OUT) / (1 - OUT));
    const sv = smooth(v);
    return {
      x: lerp(W * 0.5, W * 0.94, sv),
      y: lerp(H * 0.45, H * 0.58, sv),
      z: Z_FAR * sv,
      alpha: 1 - E_FADE(smooth((v - 0.35) / 0.65)),
      dock: 1 - smooth((t - OUT) / 0.06),
    };
  }
  return { x: W * 0.5, y: H * 0.45, z: 0, alpha: 1, dock: 1 };
}

/** 宣言浮层清晰度：接近停靠点 0→1，远离 1→0 */
function textAlpha(t: number) {
  const raw = smooth((t - 0.28) / 0.1) * (1 - smooth((t - 0.62) / 0.1));
  return E_FADE(clamp01(raw));
}

/** Our Mission 铭牌透明度：随停靠淡入（较宣言略早错峰）、随离场淡出，走 E-FADE */
function plateAlpha(t: number) {
  const raw = smooth((t - 0.26) / 0.1) * (1 - smooth((t - 0.6) / 0.1));
  return E_FADE(clamp01(raw));
}

/** 宣言浮层文字：Noto Serif SC、实心前景色（移出舟腹后镂空无底可衬，可读性优先）。
 *  lineHeight 由容器承载（build() 按视口高度下调，极扁视口防与尾翼相触） */
const maniLineStyle: CSSProperties = {
  fontSize: 'clamp(18px, 1.5vw + 9px, 38px)',
  fontWeight: 600,
  letterSpacing: '0.12em',
  color: 'hsl(var(--foreground))',
};

export default function RocketManifesto() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const plateRef = useRef<HTMLParagraphElement>(null);
  const maniRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = sectionRef.current;
    if (!canvas || !section) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = 0;
    let H = 0;
    let scrollT = REDUCED_MOTION ? 0.5 : 0;
    let prevX = 0;
    let prevY = 0;
    let prevZ = 0;
    let prevNow = 0;
    let flameLen = 0;
    let tilt = 0;
    let animationId = 0;
    let running = false;
    // CSS 变量取色（卷二 2.5 规则 1/2）：挂载时读取，.dark 切换经 MutationObserver 重取
    let theme = readCanvasTheme();

    function build() {
      if (!canvas) return;
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width = W;
      canvas.height = H;
      // 极扁视口（如 844×390 横屏）：宣言下移并收紧行距、铭牌上移，避开尾翼
      const short = H < 520;
      if (maniRef.current) {
        maniRef.current.style.top = short ? '80%' : '75%';
        maniRef.current.style.lineHeight = short ? '1.55' : '1.9';
      }
      if (plateRef.current) {
        // 极扁视口：18% ≈ 70px，恰好落在 68px sticky 导航之下
        plateRef.current.style.top = short ? '18%' : '';
      }
    }

    function draw(now: number, animate: boolean) {
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);
      const t = scrollT;
      // 视觉尺度随视口放大：L 取 min(0.72W, 1.12H)（R3 再放大，整幕构图饱满）
      const L = Math.min(W * 0.72, H * 1.12);
      const F = 6 * L; // 焦距（与 rocketLineArt 的 F_RATIO 一致）
      const p = pose(t, W, H, F);

      // 宣言浮层 / Our Mission 铭牌：可见性绑停靠阶段（E-FADE，铭牌略早错峰），随 scrub 可逆
      if (maniRef.current) {
        maniRef.current.style.opacity = textAlpha(t).toFixed(3);
      }
      if (plateRef.current) {
        plateRef.current.style.opacity = plateAlpha(t).toFixed(3);
      }

      // 速度估计（px/ms，含 z 向逼近/远离）→ 尾焰目标长度，阻尼跟随
      let speed = 0;
      if (animate && prevNow > 0) {
        const dt = Math.max(now - prevNow, 1);
        speed = Math.hypot(p.x - prevX, p.y - prevY, (p.z - prevZ) * 0.35) / dt;
      }
      prevX = p.x;
      prevY = p.y;
      prevZ = p.z;
      prevNow = now;

      if (animate) {
        const p2 = pose(Math.min(t + 0.008, 1), W, H, F);
        const dx = p2.x - p.x;
        const dy = p2.y - p.y;
        const tiltT = Math.abs(dx) > 0.3 ? Math.atan2(dy, dx) : 0;
        const clamped = Math.max(-0.18, Math.min(0.18, tiltT));
        tilt += (clamped - tilt) * 0.12;
      } else {
        tilt = 0;
      }

      const hover = animate ? Math.sin(now * 0.0012) * 4 * p.dock : 0;
      const cx = p.x;
      const cy = p.y + hover;

      // 偏航：入场机头偏向观察者（自星球纵深飞出），离场转入纵深；停靠转正
      const YAW_MAX = 0.85;
      let yaw = 0;
      if (t < 0.38) yaw = -YAW_MAX * (1 - smooth(clamp01(t / 0.38)));
      else if (t > 0.62) yaw = YAW_MAX * smooth(clamp01((t - 0.62) / 0.38));
      // 绕纵轴进动：飞行中缓旋，停靠收敛至 π/4（四翼呈 X 交叉）
      const roll = Math.PI / 4 + (animate ? (1 - p.dock) * now * 0.0005 : 0);

      // 火箭 3D 线框（描边色随主题；铜橙仅腹部环带，取色 --primary；缩放由 z 投影天然给出）
      ctx.save();
      ctx.translate(cx, cy);
      const art = drawRocketLineArt(ctx, {
        L,
        main: theme.main,
        copper: theme.copper,
        alpha: p.alpha,
        z: p.z,
        roll,
        yaw,
        tilt,
      });
      ctx.restore();

      // 尾焰（铜橙，自喷口唇口投影点沿运动反方向喷出，随透视缩放，停靠熄灭）
      const dirX = Math.cos(tilt);
      const dirY = Math.sin(tilt);
      const tailX = cx + art.tail.x;
      const tailY = cy + art.tail.y;
      const maxFlame = L * art.s * 0.3;
      const flameTarget = clamp01(speed * 2.2) * maxFlame * p.alpha;
      flameLen += (flameTarget - flameLen) * (animate ? 0.12 : 1);

      if (flameLen > 1) {
        const flick = animate ? 1 + Math.sin(now * 0.02) * 0.08 : 1;
        const fl = flameLen * flick;
        const fx = tailX - dirX * fl;
        const fy = tailY - dirY * fl;
        const grad = ctx.createLinearGradient(tailX, tailY, fx, fy);
        grad.addColorStop(0, `rgba(${theme.copper},0.5)`);
        grad.addColorStop(1, `rgba(${theme.copper},0)`);
        const pw = L * art.s * 0.05;
        ctx.beginPath();
        ctx.moveTo(tailX - dirY * pw, tailY + dirX * pw);
        ctx.lineTo(fx, fy);
        ctx.lineTo(tailX + dirY * pw, tailY - dirX * pw);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();
      }
    }

    build();
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (cancelled) return;
      if (REDUCED_MOTION) draw(0, false);
    });

    function frame(now: number) {
      if (!running) return;
      draw(now, true);
      animationId = requestAnimationFrame(frame);
    }

    const cleanups: Array<() => void> = [];

    // 主题切换：重取色；reduced-motion 静态帧立即重绘（动画帧由 rAF 自然用新色）
    cleanups.push(
      observeCanvasTheme(() => {
        theme = readCanvasTheme();
        if (REDUCED_MOTION) draw(0, false);
      }),
    );

    if (REDUCED_MOTION) {
      draw(0, false);
    } else {
      // 离屏暂停 rAF，迟滞阈值：可见 ≥10% 才启动、完全离屏才停——
      // 两幕交界各露 1px 时只保留先前一幕活跃，避免双 canvas 同时烧帧
      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry.intersectionRatio >= 0.1 && !running) {
            running = true;
            prevNow = 0;
            animationId = requestAnimationFrame(frame);
          } else if (!entry.isIntersecting && running) {
            running = false;
            cancelAnimationFrame(animationId);
          }
        },
        { threshold: [0, 0.1] },
      );
      observer.observe(canvas);
      cleanups.push(() => observer.disconnect());

      const gsapCtx = gsap.context(() => {
        ScrollTrigger.create({
          trigger: section,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
          onUpdate: (self) => {
            scrollT = self.progress;
          },
        });
      }, section);
      cleanups.push(() => gsapCtx.revert());
    }

    function onResize() {
      build();
      if (REDUCED_MOTION) draw(0, false);
    }
    window.addEventListener('resize', onResize);

    return () => {
      cancelled = true;
      running = false;
      cancelAnimationFrame(animationId);
      cleanups.forEach((fn) => fn());
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden"
      style={{ height: '100vh' }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        aria-hidden="true"
      />
      {/* 宣言 HTML 浮层：停靠期间位于火箭下方安全区（默认 0.75H，极扁视口
          由 build() 下移收行距），dock 淡入/离场淡出 */}
      <div
        ref={maniRef}
        className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 text-center pointer-events-none"
        style={{ opacity: REDUCED_MOTION ? 1 : 0, top: '75%', lineHeight: 1.9 }}
      >
        <p className="font-heading" style={maniLineStyle}>
          {LINE_1}
        </p>
        <p className="font-heading" style={maniLineStyle}>
          {LINE_2}
        </p>
      </div>
      <p
        ref={plateRef}
        className="label-plate absolute top-24 left-1/2 -translate-x-1/2 z-10"
        style={{ opacity: REDUCED_MOTION ? 1 : 0 }}
      >
        Our Mission
      </p>
    </section>
  );
}
