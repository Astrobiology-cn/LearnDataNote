import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { drawSatelliteLineArt, drawShipLineArt } from './shipLineArt';
import { drawTelescope3D, telescopeFeedPoint } from './telescopeLineArt3D';
import { readCanvasTheme, observeCanvasTheme } from '../../../lib/canvasTheme';

/**
 * ResourcesScene — 「外部资源」section 场景组件.
 *
 * 自绘 2D canvas（~78vh，背景透明，pointer-events-none）：
 * - 左下大型 3D 线框射电望远镜（telescopeLineArt3D，尺寸随场景宽度 1.0~1.7 缩放）：
 *   Lathe 式抛物碟面经纬线框 + 三支杆 + 馈源舱（全站唯一铜橙）+ 塔架三段圆柱 + 配重，
 *   真 3D 弱透视投影，碟面组随 ±4° 摆动与 1° 回弹绕俯仰轴旋转；
 *   线稿纪律：轮廓 1.5 / 结构 1.0 / 纹理 0.5 三档线宽，round join/cap，
 *   透明度 0.9 / 0.5 / 0.25 分级；碟面内面先用主题背景色填充再描线，挡住后方塔架穿帮线。
 *   锚点机制：telescopeZoneRef 不可见 div + IntersectionObserver(~0.5)，
 *   进视口装配（碟面从收拢到张开 + 馈源点亮）/ 离视口复位，绝不倒放。
 * - 电波：同心圆环从馈源径向扩散（铜橙，alpha 按半径衰减，2D 不变）。
 *   每 ~3.5s 自动一串 3 圈；点击望远镜命中区立即一束（限频 ~5 束/秒），
 *   碟面绕俯仰轴微转回弹（峰值 ~1°）。canvas pointer-events-none，点击监听 wrap。
 * - 航天器两类（shipLineArt 3D 线稿，同描边纪律）：
 *   卫星（Box 本体 + 双网格太阳能板 + 天线杆，缓慢自转）每 14-22s 一颗
 *   高空掠过（场上 1-2 颗不扎堆），被电波扫到回闪一下（被动应答）；
 *   飞船（圆柱舱 + Lathe 碟 + RTG 棒，机头方向性明确）每 25-40s 一艘从右侧缓速驶入，
 *   被电波扫到时转向来波方向、减速悬停 1-1.5s（轻微浮沉）再继续飞离，像在接受信号；
 *   两者轨迹均为轻微纵向正弦 y = baseY + A·sin((x/W)·k·π)。
 * - 标题：标题粒子目标区进入视口时（对目标区单独判定，IntersectionObserver 阈值）
 *   粒子从馈源附近的利萨茹漂浮当前位置平滑启程，拼出 'RESOURCES'（水平居中，
 *   宽 ~72% / 高 ~32%，离屏 `700 110px "Noto Serif SC", serif` + letterSpacing 0.08em
 *   采样，与 KNOWLEDGE/SCHOLARS 统一），每次进入重新实例化一批；
 *   电波同心圆环带（归一化距离 0.9~1.1）真正扫到的字母获得一次铜橙亮度脉冲（流光，~600ms 余晖）；
 *   成形后电波触发字母颤动；目标区离开视口粒子散回馈源消解，可逆、非倒放。
 * - 中文铭牌 + 描述 + 线框信号接收器入口（react-router Link）在
 *   RESOURCES 正下方同轴居中，组装完成后淡入、划走先淡没；
 *   接收器指示灯慢闪 2s，hover 碟面微扬、指示灯铜橙急闪 0.4s、
 *   浮现入口文字。
 *
 * 取色走 CSS 变量（lib/canvasTheme.ts，MutationObserver 监听 .dark 切换）；
 * IntersectionObserver 离屏暂停（迟滞阈值 0.1）；
 * prefers-reduced-motion 静态成形一帧。
 */

type Props = {
  title: string;
  desc: string;
  link: string;
  linkText: string;
};

const TITLE = 'RESOURCES';
const MAX_POINTS = 1400;
const WAVE_PERIOD = 3500; // 自动电波发射周期 (ms)
const CLICK_MIN_GAP = 200; // 点击发射频率上限：~5 束/秒

const REDUCED_MOTION =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

type Phase = 'ambient' | 'forming' | 'formed' | 'leaving';

type Pt = { x: number; y: number };

type Particle = {
  tx: number;
  ty: number;
  x: number;
  y: number;
  sx: number;
  sy: number;
  hx: number; // 散回目标（馈源附近）
  hy: number;
  frac: number; // 目标点 x 归一化位置 0..1（成形/散回分批用）
  rushAt: number; // 该批粒子启程时刻 (ms)
  dur: number;
  phase: number; // 闪烁相位
  tw: number;
  driftSeed: number; // ambient 漂浮相位
  trembleT0: number;
  trembleDx: number;
  trembleDy: number;
  pulseT0: number; // 最近一次被电波前沿扫到（流光）
};

type Ring = { t0: number; x: number; y: number };

type Satellite = {
  x: number;
  y: number;
  baseY: number; // 正弦轨迹基线高度
  amp: number; // 正弦振幅 A（6-14px）
  k: number; // 正弦波数（1-2）
  v: number;
  flashT0: number; // 最近一次被电波扫到的时刻，0 表示无
  seed: number; // 自转相位种子
};

type Ship = {
  x: number;
  y: number;
  baseY: number; // 正弦轨迹基线高度
  amp: number; // 正弦振幅 A（6-14px）
  k: number; // 正弦波数（1-2）
  v: number; // 巡航速度
  speed: number; // 当前速度（悬停包络）
  rot: number; // 当前朝向（线稿默认朝 -x，rot=0 即巡航方向）
  state: 'cruise' | 'hover' | 'leave';
  hoverT0: number;
  hoverDur: number;
  leaveT0: number;
  swept: boolean; // 已被电波扫过一次
  ox: number; // 来波方向（电波环心）
  oy: number;
};

/** 离屏渲染文字并采样目标点阵，缩放后放到以 (cx, cy) 为中心的区域 */
function sampleTargets(text: string, cx: number, cy: number, maxW: number, maxH: number): Pt[] {
  const off = document.createElement('canvas');
  const octx = off.getContext('2d', { willReadFrequently: true });
  if (!octx) return [];

  const font = '700 110px "Noto Serif SC", serif'; // 三幕统一衬线显示字体
  octx.font = font;
  octx.letterSpacing = '0.08em'; // 三幕统一字间距
  const metrics = octx.measureText(text);
  const textW = Math.max(metrics.width, 1);
  const textH = 150; // 110px 字体的安全包围盒高度

  off.width = Math.ceil(textW) + 20;
  off.height = textH;
  octx.font = font; // canvas 尺寸变更会重置 ctx 状态
  octx.letterSpacing = '0.08em';
  octx.fillStyle = '#fff';
  octx.textBaseline = 'middle';
  octx.fillText(text, 10, textH / 2);

  const img = octx.getImageData(0, 0, off.width, off.height).data;

  // 先按 6px 步长统计，超出上限则加大步长
  let step = 6;
  const count = (s: number) => {
    let n = 0;
    for (let y = 0; y < off.height; y += s)
      for (let x = 0; x < off.width; x += s)
        if (img[(y * off.width + x) * 4 + 3] > 128) n++;
    return n;
  };
  const c6 = count(step);
  if (c6 > MAX_POINTS) step = Math.max(5, Math.ceil(step * Math.sqrt(c6 / MAX_POINTS)));

  // 缩放进指定区域（宽 ~72% / 高 ~32% 视口占比，三幕统一；不额外放大）
  const scale = Math.min(maxW / textW, maxH / textH);
  const ox = cx - (textW * scale) / 2;
  const oy = cy - (textH * scale) / 2;

  const pts: Pt[] = [];
  for (let y = 0; y < off.height; y += step) {
    for (let x = 0; x < off.width; x += step) {
      if (img[(y * off.width + x) * 4 + 3] > 128) {
        pts.push({ x: ox + x * scale, y: oy + y * scale });
      }
    }
  }
  return pts;
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

/** 角度差回绕到 (-π, π]，lerp 取最短弧 */
function wrapAngle(a: number) {
  return Math.atan2(Math.sin(a), Math.cos(a));
}

export default function ResourcesScene({ title, desc, link, linkText }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);
  const titleProbeRef = useRef<HTMLDivElement>(null);
  const telescopeZoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = 0;
    let H = 0;
    let TS = 1.7; // 望远镜缩放：随场景宽度 1.0 ~ 1.7
    let particles: Particle[] = [];
    let phase: Phase = 'ambient';
    let animationId = 0;
    let running = false;

    // 电波 / 航天器 / 交互状态
    let lastWaveT = 0;
    let lastClickEmitT = -10000;
    let recoilT0 = -10000;
    const rings: Ring[] = [];
    const satellites: Satellite[] = [];
    let nextSatAt = 0;
    let ship: Ship | null = null;
    let shipNextAt = 0;
    // 望远镜装配锚点状态：进视口装配（deploy 0→1）/ 离视口复位
    let telescopeIn = false;
    let assembleT0 = 0;

    /** 铭牌文案区淡入/淡出（成形完成后显示，划走先隐藏） */
    function setCaption(show: boolean) {
      const el = captionRef.current;
      if (!el) return;
      el.style.opacity = show ? '1' : '0';
      el.style.pointerEvents = show ? 'auto' : 'none';
    }

    /* ── 几何 ─────────────────────────────────────────────── */

    // CSS 变量取色（卷二 2.5 规则 1/2）：挂载时读取，.dark 切换经 MutationObserver 重取
    let theme = readCanvasTheme();

    /** 主题色（--foreground/--background 经 getComputedStyle 读取） */
    function colors() {
      return {
        isDark: theme.isDark,
        main: theme.main,
        bg: `rgb(${theme.bgRgb})`,
      };
    }

    /** 塔架地面高度与俯仰轴（碟面摆动中心）位置 */
    function mount() {
      const groundY = H - 34;
      const baseX = Math.max(140, W * 0.1);
      const pivot = { x: baseX, y: groundY - 108 * TS };
      return { groundY, baseX, pivot };
    }

    /** 碟面局部几何（原点 = 俯仰轴，未加摆动；基准尺寸 × TS） */
    function dishGeom() {
      return {
        cx: 30 * TS,
        cy: -34 * TS,
        rx: 58 * TS,
        ry: 19 * TS,
        tilt: (25 * Math.PI) / 180, // 椭圆倾角：开口朝右上
        feedOff: 50 * TS,
      };
    }

    /** 碟面当前摆动角：±4° 缓慢方位摆动 */
    function sway(now: number) {
      return Math.sin(now * 0.00035) * ((4 * Math.PI) / 180);
    }

    /** 受击反推角：绕俯仰轴微转（峰值 ~1°，碟缘视觉等效 ~2px 弧长），90ms 指数衰减 */
    function recoilAngle(now: number) {
      const dt = now - recoilT0;
      return dt >= 0 && dt < 400 ? (Math.PI / 180) * Math.exp(-dt / 90) : 0;
    }

    /** 局部点绕俯仰轴旋转（摆动角叠加反推角）后的画布坐标 */
    function dishToWorld(lx: number, ly: number, now: number): Pt {
      const { pivot } = mount();
      const a = sway(now) - recoilAngle(now);
      const c = Math.cos(a);
      const s = Math.sin(a);
      return { x: pivot.x + lx * c - ly * s, y: pivot.y + lx * s + ly * c };
    }

    /** 馈源舱画布坐标：取 3D 模型装配完成位形的投影（与线框严格同位） */
    function feedPoint(now: number): Pt {
      const { pivot } = mount();
      return telescopeFeedPoint(pivot.x, pivot.y, TS, sway(now) - recoilAngle(now));
    }

    /** 点击命中判定：碟面圆盘 + 馈源舱 + 塔架/基座包围盒（随 mount/dishGeom 自动同步） */
    function hitTelescope(x: number, y: number, now: number): boolean {
      const { groundY, baseX, pivot } = mount();
      const g = dishGeom();
      if (x > baseX - 34 * TS && x < baseX + 34 * TS && y > pivot.y - 10 && y < groundY + 6) {
        return true;
      }
      const c = dishToWorld(g.cx, g.cy, now);
      if (Math.hypot(x - c.x, y - c.y) < g.rx * 1.15) return true;
      const f = feedPoint(now);
      if (Math.hypot(x - f.x, y - f.y) < 20 * TS) return true;
      return false;
    }

    /* ── 电波环几何（同心圆，从馈源径向扩散）───────────────── */

    /**
     * 同心圆环：rx = ry = r，环心恒为发射时的馈源点。
     * alpha 按半径衰减（而非时间）：宽屏下环活得够久、前沿能扫过整个
     * 标题行（1440px 下馈源→标题右缘 ~700-900px），越大越淡，不会变成常驻圆圈。
     */
    function ringGeom(ring: Ring, now: number) {
      const age = now - ring.t0;
      if (age < 0) return null;
      const r = age * 0.11;
      const rMax = Math.max(520, W * 0.55); // 环消亡半径：覆盖馈源→标题右缘
      const alpha = 0.45 * (1 - r / rMax);
      if (alpha <= 0) return null;
      return { r, cx: ring.x, cy: ring.y, alpha };
    }

    /* ── 望远镜绘制（3D 线框 + 装配锚点）─────────────────────── */

    function drawTelescope(now: number) {
      if (!ctx) return;
      const { main, bg } = colors();
      const { groundY, pivot } = mount();
      // 装配因子：进视口 0→1（碟面张开 + 馈源点亮，900ms easeOutCubic），离视口复位
      const deploy = REDUCED_MOTION
        ? 1
        : telescopeIn
          ? easeOutCubic(Math.min(1, (now - assembleT0) / 900))
          : 0;
      drawTelescope3D(ctx, {
        pivotX: pivot.x,
        pivotY: pivot.y,
        groundY,
        TS,
        pitch: sway(now) - recoilAngle(now),
        deploy,
        main,
        bg,
        copper: theme.copper,
      });
    }

    /* ── 电波 / 卫星 / 飞船 ───────────────────────────────── */

    /** 发射一串 3 圈电波；成形后字母随环颤动 */
    function emitBurst(now: number, gap: number) {
      const fp = feedPoint(now);
      for (let i = 0; i < 3; i++) {
        rings.push({ t0: now + i * gap, x: fp.x, y: fp.y });
      }
      if (rings.length > 24) rings.splice(0, rings.length - 24);
      if (phase === 'formed') {
        particles.forEach((p) => { p.trembleT0 = now + Math.random() * 120; });
      }
    }

    function drawWaves(now: number) {
      if (!ctx) return;
      // 自动基线：每 ~3.5s 一串
      if (now - lastWaveT > WAVE_PERIOD) {
        lastWaveT = now;
        emitBurst(now, 160);
      }

      for (const ring of rings) {
        const g = ringGeom(ring, now);
        if (!g) continue;
        ctx.strokeStyle = `rgba(${theme.copper},${g.alpha.toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(g.cx, g.cy, g.r, 0, Math.PI * 2);
        ctx.stroke();

        // 标题流光：同心圆环带真正扫到粒子目标点 (tx,ty) 才触发铜橙脉冲
        // （归一化距离 0.9~1.1，即平方距离 0.81~1.21）
        if (phase === 'formed') {
          const r2 = g.r * g.r;
          for (const p of particles) {
            const dx = p.tx - g.cx;
            const dy = p.ty - g.cy;
            const norm = (dx * dx + dy * dy) / r2;
            if (norm >= 0.81 && norm <= 1.21) p.pulseT0 = now;
          }
        }
      }
    }

    function drawSatellites(now: number) {
      if (!ctx) return;
      const { main } = colors();

      // 高空（上 1/4）每 14-22s 一颗小卫星从右向左掠过（场上 1-2 颗，不扎堆）
      if (nextSatAt === 0) nextSatAt = now + 4000 + Math.random() * 3000; // 首颗稍快
      if (now > nextSatAt) {
        if (satellites.length < 2) {
          satellites.push({
            x: W + 30,
            y: 0,
            baseY: 16 + Math.random() * H * 0.22,
            amp: 6 + Math.random() * 8,
            k: 1 + Math.random(),
            v: 0.5 + Math.random() * 0.5,
            flashT0: 0,
            seed: Math.random() * Math.PI * 2,
          });
          nextSatAt = now + 14000 + Math.random() * 8000;
        } else {
          nextSatAt = now + 4000; // 场上已有 2 颗，稍后再试
        }
      }

      for (let i = satellites.length - 1; i >= 0; i--) {
        const s = satellites[i];
        s.x -= s.v;
        // 轻微纵向正弦轨迹：y = baseY + A·sin((x/W)·k·π)
        s.y = s.baseY + s.amp * Math.sin((s.x / W) * s.k * Math.PI);
        if (s.x < -40) { satellites.splice(i, 1); continue; }

        // 电波环边界带扫到 → 回闪一下（被动应答）
        for (const ring of rings) {
          const g = ringGeom(ring, now);
          if (!g) continue;
          const dx = s.x - g.cx;
          const dy = s.y - g.cy;
          const norm = (dx * dx + dy * dy) / (g.r * g.r);
          if (norm < 1.08 && norm > 0.82) s.flashT0 = now;
        }
        const flashAge = now - s.flashT0;
        const flash = s.flashT0 > 0 && flashAge < 350 ? 1 - flashAge / 350 : 0;

        // 闪光光晕
        if (flash > 0) {
          ctx.strokeStyle = `rgba(${theme.copper},${(flash * 0.8).toFixed(3)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(s.x, s.y, 6 + (1 - flash) * 7, 0, Math.PI * 2);
          ctx.stroke();
        }

        // 卫星 3D 线稿：Box 本体 + 双网格太阳能板 + 天线杆，缓慢自转；
        // 被扫到瞬间本体转铜橙
        drawSatelliteLineArt(ctx, {
          x: s.x,
          y: s.y,
          rot: s.seed + now * 0.0006,
          main,
          copper: theme.copper,
          flash,
          alpha: 0.75 + flash * 0.25,
        });
      }
    }

    function drawShip(now: number) {
      if (!ctx) return;
      const { main } = colors();

      // 生成：每 25-40s 一艘，从右侧驶入（首次 12-20s）
      if (!ship) {
        if (shipNextAt === 0) shipNextAt = now + 12000 + Math.random() * 8000;
        if (now > shipNextAt) {
          const v = 0.42 + Math.random() * 0.12;
          ship = {
            x: W + 40,
            y: 0,
            baseY: H * (0.18 + Math.random() * 0.15),
            amp: 6 + Math.random() * 8,
            k: 1 + Math.random(),
            v,
            speed: v,
            rot: 0,
            state: 'cruise',
            hoverT0: 0,
            hoverDur: 0,
            leaveT0: 0,
            swept: false,
            ox: 0,
            oy: 0,
          };
        }
        return;
      }

      const s = ship;

      // 轻微纵向正弦轨迹（悬停时 x 近似不变，y 也近似定值）
      s.y = s.baseY + s.amp * Math.sin((s.x / W) * s.k * Math.PI);

      // 电波扫到 → 转向来波方向，减速悬停
      if (s.state === 'cruise' && !s.swept) {
        for (const ring of rings) {
          const g = ringGeom(ring, now);
          if (!g) continue;
          const dx = s.x - g.cx;
          const dy = s.y - g.cy;
          if ((dx * dx + dy * dy) / (g.r * g.r) <= 1.05) {
            s.swept = true;
            s.state = 'hover';
            s.hoverT0 = now;
            s.hoverDur = 1000 + Math.random() * 500;
            s.ox = ring.x;
            s.oy = ring.y;
            break;
          }
        }
      }

      if (s.state === 'hover') {
        const t = now - s.hoverT0;
        // 300ms 内减速到 0；悬停结束后离场
        s.speed = s.v * Math.max(0, 1 - t / 300);
        const target = Math.atan2(s.oy - s.y, s.ox - s.x) - Math.PI; // 线稿默认朝 -x
        s.rot += wrapAngle(target - s.rot) * 0.08; // 回绕取最短弧
        if (t > s.hoverDur) {
          s.state = 'leave';
          s.leaveT0 = now;
        }
      } else if (s.state === 'leave') {
        const t = now - s.leaveT0;
        s.speed = s.v * Math.min(1, t / 300);
        s.rot += wrapAngle(0 - s.rot) * 0.06; // 回正继续飞离
      }

      s.x -= s.speed;
      if (s.x < -50) {
        ship = null;
        shipNextAt = now + 25000 + Math.random() * 15000;
        return;
      }

      const bob = s.state === 'hover' && s.speed < 0.05 ? Math.sin(now * 0.004) * 1.5 : 0;

      // 飞船 3D 线稿（圆柱舱 + Lathe 碟 + RTG 棒，机头方向性明确）：
      // 被电波扫到转向来波方向、减速悬停——机头朝向变化直接可见
      // （rot=0 朝 -x 巡航，故 heading = rot + π）；绕纵轴轻微滚转更生动
      drawShipLineArt(ctx, {
        x: s.x,
        y: s.y + bob,
        heading: s.rot + Math.PI,
        roll: Math.sin(now * 0.0012) * 0.35,
        main,
        alpha: 0.85,
      });
    }

    /* ── 标题粒子 ─────────────────────────────────────────── */

    function build() {
      if (!canvas) return;
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width = W;
      canvas.height = H;
      TS = Math.min(1.7, Math.max(1.0, W / 700));

      // 点阵水平居中（cx = W/2，宽 ~72% / 高 ~32%，三幕统一占比），避开左下望远镜
      const cx = W / 2;
      const cy = H * 0.42;
      const pts = sampleTargets(TITLE, cx, cy, W * 0.72, H * 0.32);
      const minX = pts.reduce((m, p) => Math.min(m, p.x), Infinity);
      const maxX = pts.reduce((m, p) => Math.max(m, p.x), -Infinity);
      const spanX = Math.max(maxX - minX, 1);

      const old = particles;
      particles = pts.map((pt, i) => {
        const prev = old[i];
        const p: Particle = {
          tx: pt.x,
          ty: pt.y,
          x: prev ? prev.x : 0,
          y: prev ? prev.y : 0,
          sx: 0,
          sy: 0,
          hx: 0,
          hy: 0,
          frac: (pt.x - minX) / spanX,
          rushAt: 0,
          dur: 600 + Math.random() * 350,
          phase: Math.random() * Math.PI * 2,
          tw: 0.8 + Math.random() * 1.8,
          driftSeed: Math.random() * Math.PI * 2,
          trembleT0: -10000,
          trembleDx: (Math.random() - 0.5) * 2,
          trembleDy: (Math.random() - 0.5) * 2,
          pulseT0: prev ? prev.pulseT0 : -10000,
        };
        if (!prev) {
          // ambient：散布在望远镜馈源附近，待命
          const fp = feedPoint(0);
          p.x = fp.x + (Math.random() - 0.5) * 90;
          p.y = fp.y + (Math.random() - 0.5) * 90;
        }
        return p;
      });

      // 已成形时直接吸附到新目标
      if (phase === 'formed') {
        particles.forEach((p) => { p.x = p.tx; p.y = p.ty; });
      }
    }

    function drawParticles(now: number, animate: boolean) {
      if (!ctx) return;
      const { main } = colors();

      for (const p of particles) {
        if (animate && phase === 'ambient') {
          // 在馈源附近缓缓漂浮
          const fp = feedPoint(now);
          p.x = fp.x + Math.sin(now * 0.0006 + p.driftSeed) * 46 + Math.sin(p.driftSeed * 3) * 18;
          p.y = fp.y + Math.cos(now * 0.0005 + p.driftSeed * 1.7) * 40 + Math.cos(p.driftSeed * 5) * 14;
        }

        let ox = 0;
        let oy = 0;
        if (animate && phase === 'formed' && now > p.trembleT0) {
          // 电波掠过后的衰减颤动（~2px）
          const dt = now - p.trembleT0;
          const amp = 2 * Math.exp(-dt / 500);
          ox = p.trembleDx * amp * Math.sin(dt / 45);
          oy = p.trembleDy * amp * Math.sin(dt / 45);
        }

        const twinkle = animate
          ? 0.6 + 0.3 * Math.sin(now * 0.0015 * p.tw + p.phase)
          : 0.85;
        ctx.fillStyle = main;
        ctx.globalAlpha = twinkle;
        ctx.beginPath();
        ctx.arc(p.x + ox, p.y + oy, 1.3, 0, Math.PI * 2);
        ctx.fill();

        // 流光脉冲：电波前沿扫过后的铜橙余晖（~600ms）
        const pAge = now - p.pulseT0;
        if (pAge >= 0 && pAge < 600) {
          const pa = (1 - pAge / 600) * 0.9;
          ctx.fillStyle = `rgba(${theme.copper},${pa.toFixed(3)})`;
          ctx.globalAlpha = 1;
          ctx.beginPath();
          ctx.arc(p.x + ox, p.y + oy, 1.7, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    }

    function startForming(now: number) {
      if (phase !== 'ambient') return;
      phase = 'forming';
      // 从利萨茹漂浮的当前位置直接启程（不再重置为馈源附近随机方块，
      // 消除「曲线→方块」跳变；每次进入仍是重新实例化的一批，非倒放）
      particles.forEach((p) => {
        p.sx = p.x;
        p.sy = p.y;
        // 按 x 从左到右分批启程
        p.rushAt = now + 300 + p.frac * 1400 * (0.7 + Math.random() * 0.3);
      });
      lastWaveT = now - WAVE_PERIOD; // 立即 emit 一串电波，带粒子飞出
    }

    function startDissolving(now: number) {
      if (phase !== 'formed' && phase !== 'forming') return;
      phase = 'leaving';
      setCaption(false); // 划走先淡没
      const fp = feedPoint(now);
      particles.forEach((p) => {
        p.sx = p.x;
        p.sy = p.y;
        // 散回馈源方向：按 x 从右到左错峰收回
        p.hx = fp.x + (Math.random() - 0.5) * 70;
        p.hy = fp.y + (Math.random() - 0.5) * 70;
        p.rushAt = now + (1 - p.frac) * 900 * (0.7 + Math.random() * 0.3);
        p.dur = 550 + Math.random() * 300;
      });
    }

    /* ── 主循环 ─────────────────────────────────────────── */

    function draw(now: number, animate: boolean) {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, W, H);

      // forming：粒子按 rushAt 分批从望远镜方向飞向目标
      // leaving：粒子按 rushAt 分批散回馈源附近
      if (animate && (phase === 'forming' || phase === 'leaving')) {
        let allDone = true;
        for (const p of particles) {
          const k = (now - p.rushAt) / p.dur;
          const gx = phase === 'leaving' ? p.hx : p.tx;
          const gy = phase === 'leaving' ? p.hy : p.ty;
          if (k < 0) { allDone = false; continue; }
          if (k < 1) {
            allDone = false;
            const e = easeOutCubic(k);
            p.x = p.sx + (gx - p.sx) * e;
            p.y = p.sy + (gy - p.sy) * e;
          } else {
            p.x = gx;
            p.y = gy;
          }
        }
        if (allDone) {
          if (phase === 'forming') setCaption(true); // 组装完成后淡入
          phase = phase === 'leaving' ? 'ambient' : 'formed';
        }
      }

      drawTelescope(now);
      if (animate) {
        drawWaves(now);
        drawSatellites(now);
        drawShip(now);
      }
      drawParticles(now, animate);
    }

    function frame(now: number) {
      if (!running) return;
      draw(now, true);
      animationId = requestAnimationFrame(frame);
    }

    build();
    // 字体就绪后重建一次，保证按真实字形采样
    let cancelled = false;
    document.fonts?.ready.then(() => { if (!cancelled && phase === 'ambient') build(); });

    const cleanups: Array<() => void> = [];

    // 主题切换：重取色；reduced-motion 静态帧立即重绘（动画帧由 rAF 自然用新色）
    cleanups.push(
      observeCanvasTheme(() => {
        theme = readCanvasTheme();
        if (REDUCED_MOTION) draw(0, false);
      }),
    );

    if (REDUCED_MOTION) {
      // 静态成形一帧
      phase = 'formed';
      particles.forEach((p) => { p.x = p.tx; p.y = p.ty; });
      draw(0, false);
      setCaption(true);
    } else {
      // 离屏暂停 rAF（提示词§九：所有 canvas 必须接 IntersectionObserver）
      // 迟滞阈值：可见 ≥10% 才启动、完全离屏才停——交界 1px 时只留一幕活跃
      const pauseObserver = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry.intersectionRatio >= 0.1 && !running) {
            running = true;
            animationId = requestAnimationFrame(frame);
          } else if (!entry.isIntersecting && running) {
            running = false;
            cancelAnimationFrame(animationId);
          }
        },
        { threshold: [0, 0.1] },
      );
      pauseObserver.observe(canvas);
      cleanups.push(() => pauseObserver.disconnect());

      // 标题成形/飞散：对标题粒子目标区（probe，与 sampleTargets 区域同位）
      // 单独判定——目标区进入视口 20% 即启程显影（R5 显影前提：粒子自馈源
      // 飞向标题的 1.5-2.5s 迁徙过程填进 Scholars→Resources 幕间空窗，
      // 同 R4 火箭显影前提纪律），<5%（回滚时）散回馈源；
      // 重新进入时 startForming 重新实例化一批粒子，非倒放
      const titleProbe = titleProbeRef.current;
      if (titleProbe) {
        const phaseObserver = new IntersectionObserver(
          (entries) => {
            const entry = entries[0];
            const now = performance.now();
            // 迟滞：≥0.2 成形 / <0.05 飞散，边界驻留不抖动
            if (entry.intersectionRatio >= 0.2) startForming(now);
            else if (entry.intersectionRatio < 0.05) startDissolving(now);
          },
          { threshold: [0, 0.05, 0.2] },
        );
        phaseObserver.observe(titleProbe);
        cleanups.push(() => phaseObserver.disconnect());
      }

      // 初始若标题目标区已在视口内（如刷新定位），立即聚拢
      {
        const r = titleProbe?.getBoundingClientRect();
        if (r && r.top < window.innerHeight && r.bottom > 0) startForming(performance.now());
      }

      // 望远镜装配锚点：telescopeZoneRef 进入视口 ~50% → 装配（碟面张开 +
      // 馈源点亮）；离开 → 复位 deploy=0，再进重新装配（非倒放）
      const telescopeZone = telescopeZoneRef.current;
      if (telescopeZone) {
        const scopeObserver = new IntersectionObserver(
          (entries) => {
            const entry = entries[0];
            if (entry.intersectionRatio >= 0.5) {
              if (!telescopeIn) {
                telescopeIn = true;
                assembleT0 = performance.now();
              }
            } else {
              telescopeIn = false;
            }
          },
          { threshold: [0, 0.5] },
        );
        scopeObserver.observe(telescopeZone);
        cleanups.push(() => scopeObserver.disconnect());

        // 初始若望远镜区已在视口内（如刷新定位），立即开始装配
        const r = telescopeZone.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) {
          telescopeIn = true;
          assembleT0 = performance.now();
        }
      }

      // 点击望远镜命中区 → 立即发射一束电波（频率上限 ~5 束/秒）+ 碟面反推
      function onClick(e: MouseEvent) {
        if (!canvas) return;
        // 点击入口链接等元素时不触发
        if ((e.target as HTMLElement | null)?.closest('a')) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const now = performance.now();
        if (!hitTelescope(x, y, now)) return;
        if (now - lastClickEmitT < CLICK_MIN_GAP) return;
        lastClickEmitT = now;
        recoilT0 = now;
        emitBurst(now, 110);
      }
      wrap.addEventListener('click', onClick);
      cleanups.push(() => wrap.removeEventListener('click', onClick));
    }

    function onResize() {
      build();
      if (REDUCED_MOTION) {
        particles.forEach((p) => { p.x = p.tx; p.y = p.ty; });
        draw(0, false);
      }
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
    <section className="relative w-full">
      {/* 场景层：canvas + 场景内文案/入口 */}
      <div ref={wrapRef} className="relative w-full" style={{ height: '78vh', minHeight: 420 }}>
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          aria-hidden="true"
        />

        {/* 标题粒子目标区探针：与 sampleTargets 区域同位（cx 50% / cy 42%，
            范围 72%×32%），phaseObserver 据此单独判定标题成形/飞散 */}
        <div
          ref={titleProbeRef}
          aria-hidden="true"
          className="absolute pointer-events-none"
          style={{ left: '14%', top: '26%', width: '72%', height: '32%' }}
        />

        {/* 望远镜装配锚点：覆盖左下望远镜区，scopeObserver(~0.5) 据此
            触发装配（碟面张开 + 馈源点亮）/ 复位 */}
        <div
          ref={telescopeZoneRef}
          aria-hidden="true"
          className="absolute pointer-events-none"
          style={{ left: '2%', top: '30%', width: '30%', height: '68%' }}
        />

        {/* 铭牌 + 描述 + 信号接收器入口：RESOURCES 正下方同轴居中，
            组装完成后淡入、划走先淡没（由 canvas 状态机驱动） */}
        <div
          ref={captionRef}
          className="absolute left-1/2 top-[60%] z-10 flex w-[min(280px,78vw)] -translate-x-1/2 flex-col items-center text-center"
          style={{
            opacity: 0,
            pointerEvents: 'none',
            transition: 'opacity 0.5s cubic-bezier(0.455, 0.03, 0.515, 0.955)',
          }}
        >
          <p className="label-plate mb-3 opacity-80">{title}</p>
          <p className="text-sm text-secondary-foreground/60 leading-relaxed mb-7 whitespace-pre-line">{desc}</p>

          {/* 线框信号接收器入口：仰天抛物面小碟 + 馈源杆 + 立柱基座，
              与大射电望远镜呼应但不雷同；默认 currentColor，仅 hover 转铜橙 */}
          <Link
            to={link}
            className="receiver group inline-flex flex-col items-center gap-2 text-muted-foreground transition-colors duration-500 hover:text-primary"
            aria-label={linkText}
          >
            <svg
              width="56"
              height="64"
              viewBox="0 0 56 64"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {/* 碟面组（hover 绕轴承微扬 -8°）：碟 + 馈源杆 + 指示灯 */}
              <g className="rc-dish">
                {/* 指示灯桅杆（纹理 0.5/0.5） */}
                <path d="M28 15.2 L28 9.8" strokeWidth="0.5" opacity="0.5" />
                {/* 顶部指示灯：平时慢闪 2s，hover 铜橙急闪 0.4s */}
                <circle className="rc-light" cx="28" cy="7" r="2.5" fill="currentColor" stroke="none" />
                {/* 馈源舱（结构 1.0） */}
                <circle cx="28" cy="17" r="1.8" strokeWidth="1" />
                {/* 馈源支杆（结构 1.0/0.5）：碟缘 → 馈源舱 */}
                <path d="M14.5 28.5 L28 17 M41.5 28.5 L28 17" strokeWidth="1" opacity="0.5" />
                {/* 碟面颈部（结构 1.0/0.5）：碟底 → 轴承 */}
                <path d="M28 37.5 L28 43" strokeWidth="1" opacity="0.5" />
                {/* 碟面内弧（纹理 0.5/0.25） */}
                <path d="M17.5 29.5 Q28 41 38.5 29.5" strokeWidth="0.5" opacity="0.25" />
                {/* 抛物面碟前缘（轮廓 1.5）：仰天开口 */}
                <path d="M13 27 Q28 46 43 27" strokeWidth="1.5" />
              </g>
              {/* 固定层：轴承 + 立柱 + 基座 */}
              <circle cx="28" cy="44.5" r="2.2" strokeWidth="1.5" />
              <path d="M28 46.7 L28 57" strokeWidth="1" opacity="0.5" />
              <path d="M20 58 L36 58" strokeWidth="1.5" />
              <path d="M23 58 L21 61 M33 58 L35 61" strokeWidth="0.5" opacity="0.25" />
            </svg>
            <span className="rc-label text-[11px] font-semibold tracking-[0.25em] uppercase">
              {linkText}
            </span>
          </Link>
        </div>
      </div>

      {/* 接收器交互动画 */}
      <style>{`
        .receiver .rc-light {
          animation: rc-blink 2s ease-in-out infinite;
        }
        .receiver:hover .rc-light,
        .receiver:focus-visible .rc-light {
          animation-duration: 0.4s;
        }
        @keyframes rc-blink {
          0%, 100% { opacity: 0.2; }
          50%      { opacity: 1; }
        }
        .receiver .rc-dish {
          transform-box: view-box;
          transform-origin: 28px 44.5px;
          transition: transform 0.5s cubic-bezier(0.165, 0.84, 0.44, 1);
        }
        .receiver:hover .rc-dish,
        .receiver:focus-visible .rc-dish {
          transform: rotate(-8deg);
        }
        .receiver .rc-label {
          opacity: 0;
          transform: translateY(4px);
          transition: opacity 0.5s cubic-bezier(0.455, 0.03, 0.515, 0.955),
            transform 0.5s cubic-bezier(0.455, 0.03, 0.515, 0.955);
        }
        .receiver:hover .rc-label,
        .receiver:focus-visible .rc-label {
          opacity: 1;
          transform: translateY(0);
        }
        @media (prefers-reduced-motion: reduce) {
          .receiver .rc-light { animation: none; opacity: 1; }
          .receiver .rc-dish { transition: none; }
        }
      `}</style>
    </section>
  );
}
