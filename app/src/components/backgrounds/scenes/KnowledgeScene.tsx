import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { drawScopeLineArt } from './scopeLineArt';
import { drawToolboxLineArt } from './toolboxLineArt';
import { readCanvasTheme, observeCanvasTheme } from '../../../lib/canvasTheme';

gsap.registerPlugin(ScrollTrigger);

/**
 * KnowledgeScene — 首页「学科知识」section 场景.
 *
 * canvas 自绘 2D 场景（~78vh），铭牌/desc/入口工具箱均为场景内绝对定位元素：
 * - 滚动叙事：ScrollTrigger scrub（'top bottom' → 'center center'）驱动细圆轮廓
 *   从场景上方展开为下 1/4 处的地平线弧；成形后弧线常驻：弧下微暗地面 +
 *   弧线上缘一线铜橙微光。
 * - 尾部衔接：第二段 ScrollTrigger scrub（'center center' → 'bottom top'）驱动
 *   地平线弧 + 地面 + 望远镜整体下沉 ~15%H 并淡出至 0，"地面沉降、星空浮现"；
 *   地面自地面线向下 alpha 渐隐为透明（与下一幕星野同色系），收尾不留实线断带。
 * - 流星雨：每 8-12s 一颗自右上向左下划过，头部携带完整数学公式/化学式文本
 *   （E=mc²、H₂O …），拖尾渐隐。
 * - 望远镜：参数化 canvas 线稿（scopeLineArt.ts，与 ResourcesScene 射电望远镜
 *   同一描边纪律），位于地平线 0.72W 处、默认朝左指向标题区，与下一场景射电
 *   望远镜对望。三脚架为静态层（脚底钉死在地面线），镜筒组件以少量 3D 特征
 *   点/圆环绕枢轴做真方位角 + 俯仰，经弱透视投影（s = F/(F+z)）画 1px 线稿，
 *   转向观察者时筒口投影为正圆。桌面鼠标拖拽场景改变指向：水平拖 → 方位角
 *   （105°–255°）、垂直拖 → 仰角（15°–75°）；阻尼跟随，松手保持，4s 后缓慢
 *   回归默认（±2°、周期 12s 摆动）。拖拽中枢轴处透铜橙焦点微光；随地面整体
 *   下沉淡出。
 * - 标题成形（可逆）：标题粒子目标区（不可见锚点 div，覆盖点阵所在带）进入
 *   视口即触发——携带短公式/符号的流星粒子从右上辐射点坠落拼出 'KNOWLEDGE'
 *   （离屏 `700 110px "Noto Serif SC"` 采样，letterSpacing 0.08em，与另两幕统一
 *   衬线显示字体；点阵宽约束 0.72W、高 0.32H、水平居中于 cx=W/2、cy≈H*0.3）；
 *   统一 0.9s 时长、每 40 粒一批、批间 stagger 60ms、easeOutCubic；成形后轻微
 *   闪烁，每 4-7s 一颗飞出再归位；标题区离开视口即顺流星雨方向往左下飞散离场，
 *   回流重新从右上坠落成形（进入重新实例化、离开消解，绝不倒放）。
 * - 中文铭牌 + desc：KNOWLEDGE 正下方居中，组装完成 0.3s 后淡入，划走先淡没。
 * - 主题入口：望远镜旁地面上的 3D 线框工具箱（toolboxLineArt.ts，与望远镜同一
 *   弱透视投影纪律）——Box 箱体 + 绕后下沿铰链真 3D 旋转的箱盖 + 提手 + 锁扣 +
 *   箱内扳手/直尺/齿轮剪影；不可见锚点 toolboxZoneRef 进视口（IO 阈值 0.5）自动
 *   开箱（-100°、easeOutCubic 0.6s）、离视口合盖（状态机，进入重播、离开合盖，
 *   绝不倒放）；开箱时箱内透白色径向辉光（深 0.5 / 浅 0.7，严禁铜橙）。入口仍
 *   为 react-router Link（透明点击区覆盖线框），hover 线框提亮加粗 + 「进入学科
 *   知识 →」文字浮现（前景色，不用铜橙）。
 *
 * 所有 CSS 淡入淡出统一 0.5s cubic-bezier(0.455,0.03,0.515,0.955)。
 * 取色走 CSS 变量（lib/canvasTheme.ts，MutationObserver 监听 .dark 切换）；
 * IntersectionObserver 离屏暂停 rAF（迟滞阈值 0.1）；
 * prefers-reduced-motion 静态绘制一帧成形场景；canvas pointer-events-none，
 * 拖拽监听挂在场景 wrap div 上（仅 pointerType=mouse，不与触摸滚动冲突）。
 */

type Props = {
  title: string;
  desc: string;
  link: string;
  linkText: string;
};

const TITLE_TEXT = 'KNOWLEDGE';
const GLYPHS = '∂∇∫πλμσφω∞√∑Δθ';
/** 字母粒子的短串池（小字号可读性优先，混入单符号） */
const FRAGS = ['E=mc²', 'H₂O', 'CO₂', 'CH₄', 'NH₃', 'FeO', 'SiO₂', 'Δv', '√2', 'λ', 'π', '∞', 'Φ', 'Ω'];
/** 背景流星携带的完整公式/化学式 */
const FORMULAS = [
  'E=mc²',
  'F=GmM/r²',
  '∂u/∂x=∂v/∂y',
  '∮E·dl=Q/ε₀',
  'Δv=ve·ln(m₀/m)',
  'H₂O',
  'CH₄',
  'NH₃',
  'CO₂',
  'SiO₂',
  'FeO',
];
const COPPER = '234,109,21';
const MAX_POINTS = 1200;
/** 望远镜默认指向：正左（与下一场景左下朝右上的射电望远镜对望） */
const AZ_DEFAULT = 180;
const ALT_DEFAULT = 40;

const REDUCED_MOTION =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

type Phase = 'ambient' | 'forming' | 'formed' | 'scattering';

type Pt = { x: number; y: number };

type Geom = { cx: number; cy: number; R: number; horizonY: number };

type GlyphParticle = {
  tx: number;
  ty: number;
  x: number;
  y: number;
  sx: number; // forming/scattering 行程起点
  sy: number;
  ex: number; // scattering 飞散终点（左下，顺流星雨方向）
  ey: number;
  delay: number;
  dur: number;
  text: string; // 短公式/符号
  size: number; // 9-13px
  phase: number;
  tw: number;
  trail: Pt[];
};

type Meteor = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  len: number;
  bright: number;
  born: number;
  life: number;
  text: string; // 头部携带的公式文本
};

/** 离屏渲染文字并采样目标点阵，缩放后放到以 (cx, cy) 为中心的区域（三幕统一） */
function sampleTargets(text: string, cx: number, cy: number, maxW: number, maxH: number): Pt[] {
  const off = document.createElement('canvas');
  const octx = off.getContext('2d', { willReadFrequently: true });
  if (!octx) return [];

  const font = '700 110px "Noto Serif SC", serif';
  octx.font = font;
  octx.letterSpacing = '0.08em';
  const textW = Math.max(octx.measureText(text).width, 1);
  const textH = 150; // 110px 字体的安全包围盒高度

  off.width = Math.ceil(textW) + 20;
  off.height = textH;
  octx.font = font; // canvas 尺寸变更会重置 ctx 状态
  octx.letterSpacing = '0.08em';
  octx.fillStyle = '#fff';
  octx.textBaseline = 'middle';
  octx.fillText(text, 10, textH / 2);

  const img = octx.getImageData(0, 0, off.width, off.height).data;

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

  // 缩放进指定区域（宽 0.72W / 高 0.32H），允许适度放大以匹配 78vh 场景高度
  const scale = Math.min(maxW / textW, maxH / textH, 1.6);
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

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

export default function KnowledgeScene({ title, desc, link, linkText }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // 标题粒子目标区的不可见锚点：成形/消散只按标题区进出视口判定
  const titleZoneRef = useRef<HTMLDivElement>(null);
  // 工具箱自动开合锚点：进视口（IO 阈值 0.5）开箱、离视口合盖
  const toolboxZoneRef = useRef<HTMLDivElement>(null);
  // 入口 Link hover → canvas 线框提亮（不写 state，避免重渲染）
  const toolboxHoverRef = useRef(false);
  // 字母组装完成 → 铭牌/desc 淡入；划走 → 先淡没
  const [formed, setFormed] = useState(REDUCED_MOTION);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    const section = sectionRef.current;
    const titleZone = titleZoneRef.current;
    const toolboxZone = toolboxZoneRef.current;
    if (!canvas || !wrap || !section || !titleZone || !toolboxZone) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = 0;
    let H = 0;
    let scrollT = REDUCED_MOTION ? 1 : 0;
    let settleT = 0; // 尾部衔接：地面沉降淡出进度
    let phase: Phase = REDUCED_MOTION ? 'formed' : 'ambient';
    let formingT0 = 0;
    let scatterT0 = 0;
    let glyphs: GlyphParticle[] = [];
    const meteors: Meteor[] = [];
    let nextMeteorAt = 0;
    let lastFrame = 0;
    let animationId = 0;
    let running = false;
    // formed 后单颗飞出再归位（每 4-7s 一颗）
    let nextExcAt = 0;
    let excT0 = 0;
    let excIdx = -1;
    let excDx = 0;
    let excDy = 0;
    // 望远镜指向（度）：az 方位角（180 = 屏幕正左），alt 仰角（15-75）
    let azCur = AZ_DEFAULT;
    let altCur = ALT_DEFAULT;
    let azT = AZ_DEFAULT;
    let altT = ALT_DEFAULT;
    let dragging = false;
    let dragId = -1;
    let dragX0 = 0;
    let dragY0 = 0;
    let azStart = AZ_DEFAULT;
    let altStart = ALT_DEFAULT;
    let resumeAt = 0; // 松手后回归默认跟踪的起始时刻
    // 工具箱盖状态机：进视口重播开箱（easeOutCubic 0.6s）、离视口合盖，绝不倒放
    let lidOpenT = REDUCED_MOTION ? 1 : 0;
    let lidFrom = lidOpenT;
    let lidTarget = lidOpenT;
    let lidT0 = 0;
    let hoverCur = 0; // hover 提亮平滑值

    /** 开箱/合盖状态切换：从当前开度接续插值到目标（进入重播开箱、离开合盖） */
    function setLid(open: boolean, now: number) {
      const target = open ? 1 : 0;
      if (target === lidTarget) return;
      lidFrom = lidOpenT;
      lidTarget = target;
      lidT0 = now;
    }
    // CSS 变量取色（卷二 2.5 规则 1/2）：挂载时读取，.dark 切换经 MutationObserver 重取
    let theme = readCanvasTheme();

    function colors() {
      return {
        isDark: theme.isDark,
        main: theme.main,
        rgb: theme.rgb,
        // 地面与下一幕星野同色系（暗色取 abyss 背景族），由地面线向下渐隐为透明
        groundRgb: theme.isDark ? theme.bgRgb : theme.rgb,
        groundA: theme.isDark ? 0.55 : 0.07,
      };
    }

    /** 圆 → 地平线弧的滚动插值几何 */
    function horizonGeom(): Geom {
      const t = scrollT;
      const horizonY = H * 0.75;
      const R0 = Math.max(24, Math.min(W, H) * 0.09);
      const arcRise = H * 0.035; // 成形后弧顶高出地平线的高度
      const halfSpan = W * 0.62; // 成形后弧与地平线交点的半宽
      const R1 = (halfSpan * halfSpan) / (2 * arcRise) + arcRise / 2;
      const R = R0 + (R1 - R0) * t;
      const yTop = H * 0.14 + (horizonY - arcRise - H * 0.14) * t;
      return { cx: W / 2, cy: yTop + R, R, horizonY };
    }

    /** 地平线弧在 x 处的地面高度（弧顶之上） */
    function groundYAt(geom: Geom, x: number) {
      const dx = x - geom.cx;
      if (Math.abs(dx) >= geom.R) return geom.horizonY;
      return geom.cy - Math.sqrt(geom.R * geom.R - dx * dx);
    }

    function build() {
      if (!canvas) return;
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width = W;
      canvas.height = H;

      const pts = sampleTargets(TITLE_TEXT, W / 2, H * 0.3, W * 0.72, H * 0.32);
      const old = glyphs;
      glyphs = pts.map((pt, i) => {
        const prev = old[i];
        const useFrag = Math.random() < 0.22; // 少量短公式，多数单符号保证小字号可读
        return {
          tx: pt.x,
          ty: pt.y,
          x: prev ? prev.x : pt.x,
          y: prev ? prev.y : pt.y,
          sx: 0,
          sy: 0,
          ex: 0,
          ey: 0,
          delay: Math.floor(i / 40) * 60, // 每批 40 粒、批间 stagger 60ms
          dur: 900, // 统一 0.9s
          text: useFrag
            ? FRAGS[Math.floor(Math.random() * FRAGS.length)]
            : GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
          size: 9 + Math.floor(Math.random() * 5), // 9-13px
          phase: Math.random() * Math.PI * 2,
          tw: 0.8 + Math.random() * 1.8,
          trail: [],
        };
      });
      if (phase === 'formed') glyphs.forEach((g) => { g.x = g.tx; g.y = g.ty; });
    }

    /** 极大期：粒子自右上辐射点坠落成形；scattering 中断时从当前位置接续 */
    function startForming(now: number) {
      if (phase !== 'ambient' && phase !== 'scattering') return;
      const resume = phase === 'scattering';
      phase = 'forming';
      formingT0 = now;
      glyphs.forEach((g, i) => {
        if (!resume) {
          g.x = g.tx + W * 0.25 + Math.random() * W * 0.4;
          g.y = g.ty - H * 0.2 - Math.random() * H * 0.35;
        }
        g.sx = g.x;
        g.sy = g.y;
        g.delay = Math.floor(i / 40) * 60;
        g.dur = 900;
        g.trail = [];
      });
    }

    /** 划走：粒子顺流星雨方向继续往左下飞散离场 */
    function startScattering(now: number) {
      if (phase !== 'forming' && phase !== 'formed') return;
      phase = 'scattering';
      scatterT0 = now;
      excT0 = 0;
      excIdx = -1;
      setFormed(false); // 铭牌/desc 先淡没
      glyphs.forEach((g) => {
        g.sx = g.x;
        g.sy = g.y;
        g.ex = g.tx - W * (0.3 + Math.random() * 0.5);
        g.ey = g.ty + H * (0.35 + Math.random() * 0.45);
        g.delay = Math.random() * 600;
        g.dur = 700 + Math.random() * 400;
        g.trail = [];
      });
    }

    /* ── 场景各层绘制 ─────────────────────────────────────── */

    /** 只绘制圆在地平线以上的部分（未相交时为整圆） */
    function strokeArc(geom: Geom, style: string, width: number, alpha: number, rOff = 0) {
      if (!ctx) return;
      const { cx, cy, R, horizonY } = geom;
      const r = R + rOff;
      if (r <= 0) return;
      const d = cy - horizonY;
      ctx.beginPath();
      if (d <= -r) {
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
      } else if (d < r) {
        const a = Math.asin(Math.max(-1, Math.min(1, d / r)));
        ctx.arc(cx, cy, r, -Math.PI + a, -a);
      } else {
        return;
      }
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = style;
      ctx.lineWidth = width;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    /** 弧下微暗地面：自地面线向下 alpha 渐隐为透明（收尾不留实线断带） */
    function fillGround(geom: Geom, groundRgb: string, groundA: number, alpha: number, fadeBottom = H) {
      if (!ctx) return;
      const { cx, cy, R, horizonY } = geom;
      const d = cy - horizonY;
      if (d <= -R || d >= R) return;
      const a = Math.asin(Math.max(-1, Math.min(1, d / R)));
      const cos = Math.cos(a);
      const xL = cx - R * cos;
      const xR = cx + R * cos;
      // 渐隐终点对齐场景底边的设备坐标（本地 = H - sinkY），
      // 保证地面下沉途中 section 底边处 alpha 也恰好为 0，收口无断带
      const grad = ctx.createLinearGradient(0, horizonY, 0, Math.max(horizonY + 1, fadeBottom));
      grad.addColorStop(0, `rgba(${groundRgb},${groundA.toFixed(3)})`);
      grad.addColorStop(1, `rgba(${groundRgb},0)`);
      ctx.beginPath();
      ctx.arc(cx, cy, R, -Math.PI + a, -a);
      ctx.lineTo(xR, H);
      ctx.lineTo(xL, H);
      ctx.closePath();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    /**
     * 参数化线稿望远镜（右侧 0.72W、默认朝左）：三脚架静态钉地，镜筒组件
     * 绕枢轴做真方位角 + 俯仰（弱透视投影）；随地面下沉淡出；拖拽中透铜橙焦点微光。
     */
    function drawScope(now: number, geom: Geom, alpha: number, animate: boolean, main: string) {
      if (!ctx || alpha <= 0) return;

      // 指向状态机：拖动阻尼跟随 → 松手保持 → 4s 后缓慢回归默认跟踪
      if (animate) {
        if (dragging) {
          azCur += (azT - azCur) * 0.18;
          altCur += (altT - altCur) * 0.18;
        } else if (now > resumeAt && (azCur !== AZ_DEFAULT || altCur !== ALT_DEFAULT)) {
          azCur += (AZ_DEFAULT - azCur) * 0.012;
          altCur += (ALT_DEFAULT - altCur) * 0.012;
          if (Math.abs(azCur - AZ_DEFAULT) < 0.02 && Math.abs(altCur - ALT_DEFAULT) < 0.02) {
            azCur = AZ_DEFAULT;
            altCur = ALT_DEFAULT;
          }
        }
      }
      const atDefault = azCur === AZ_DEFAULT && altCur === ALT_DEFAULT;
      const wob = animate && atDefault ? Math.sin((now * Math.PI * 2) / 12000) * 2 : 0; // ±2°、周期 12s

      const bx = W * 0.72;
      const by = groundYAt(geom, bx);
      const mh = Math.max(34, H * 0.075); // 支架高（枢轴→脚底）
      const px = bx;
      const py = by - mh;

      drawScopeLineArt(ctx, {
        px,
        py,
        groundY: by,
        mh,
        azDeg: azCur,
        altDeg: altCur + wob,
        main,
        copper: COPPER,
        alpha: alpha * 0.9,
      });

      // 拖拽焦点：枢轴处铜橙微光
      if (dragging) {
        const gr = ctx.createRadialGradient(px, py, 0, px, py, mh * 1.1);
        gr.addColorStop(0, `rgba(${COPPER},${(0.28 * alpha).toFixed(3)})`);
        gr.addColorStop(1, `rgba(${COPPER},0)`);
        ctx.fillStyle = gr;
        ctx.beginPath();
        ctx.arc(px, py, mh * 1.1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    /**
     * 3D 线框工具箱（望远镜右侧地面上，0.765W）：锚点进视口自动开箱
     * （绕后下沿铰链 -100°、easeOutCubic 0.6s）、离视口合盖；开箱透白色
     * 径向辉光；hover 提亮加粗（前景色）。随地面整体下沉淡出。
     */
    function drawToolbox(now: number, geom: Geom, alpha: number, animate: boolean, main: string, isDark: boolean) {
      if (!ctx || alpha <= 0) return;

      // 盖开合插值（0.6s easeOutCubic，从打断点开度接续，绝不倒放）
      if (animate && lidOpenT !== lidTarget) {
        const k = clamp01((now - lidT0) / 600);
        const e = easeOutCubic(k);
        lidOpenT = lidTarget === 1 ? lidFrom + (1 - lidFrom) * e : lidFrom * (1 - e);
        if (k >= 1) lidOpenT = lidTarget;
      }
      // hover 提亮平滑（reduced-motion 静态帧直接到位）
      const hoverGoal = toolboxHoverRef.current ? 1 : 0;
      hoverCur = animate ? hoverCur + (hoverGoal - hoverCur) * 0.18 : hoverGoal;

      const bx = W * 0.765;
      const by = groundYAt(geom, bx);
      const bs = Math.max(26, H * 0.05); // 箱体净高，全部尺寸基准

      drawToolboxLineArt(ctx, {
        px: bx,
        groundY: by,
        bs,
        openT: lidOpenT,
        hoverT: hoverCur,
        main,
        alpha: alpha * 0.9,
        isDark,
      });
    }

    function drawMeteors(now: number, animate: boolean, rgb: string) {
      if (!ctx) return;
      if (animate && now > nextMeteorAt && meteors.length < 12) {
        nextMeteorAt = now + 8000 + Math.random() * 4000; // 每 8-12s 一颗
        const fromTop = Math.random() < 0.55;
        const ang = Math.PI * (0.72 + Math.random() * 0.1); // 右上 → 左下
        const sp = 0.35 + Math.random() * 0.4;
        meteors.push({
          x: fromTop ? W * 0.3 + Math.random() * W * 0.9 : W + 60,
          y: fromTop ? -50 : Math.random() * H * 0.25 - 20,
          vx: Math.cos(ang) * sp,
          vy: Math.sin(ang) * sp,
          len: 50 + Math.random() * 110,
          bright: 0.3 + Math.random() * 0.55,
          born: now,
          life: 1400 + Math.random() * 900,
          text: FORMULAS[Math.floor(Math.random() * FORMULAS.length)],
        });
      }
      const dt = animate ? (lastFrame ? Math.min(now - lastFrame, 60) : 16) : 0;
      ctx.font = '12px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        const age = now - m.born;
        if (age > m.life || m.x < -m.len - 120 || m.y > H + m.len + 80) {
          meteors.splice(i, 1);
          continue;
        }
        const a = m.bright * Math.sin(Math.PI * clamp01(age / m.life));
        if (a <= 0.01) continue;
        const sp = Math.hypot(m.vx, m.vy) || 1;
        const tx = m.x - (m.vx / sp) * m.len;
        const ty = m.y - (m.vy / sp) * m.len;
        const grad = ctx.createLinearGradient(m.x, m.y, tx, ty);
        grad.addColorStop(0, `rgba(${rgb},${a.toFixed(3)})`);
        grad.addColorStop(1, `rgba(${rgb},0)`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        // 头部携带完整公式文本，随拖尾同向飞行
        ctx.fillStyle = `rgba(${rgb},${Math.min(a + 0.2, 1).toFixed(3)})`;
        ctx.fillText(m.text, m.x, m.y);
      }
    }

    function drawGlyphs(now: number, animate: boolean, main: string, rgb: string) {
      if (!ctx || phase === 'ambient') return;

      // forming 归位插值（easeOutCubic 减速落位）
      if (animate && phase === 'forming') {
        let allDone = true;
        for (const g of glyphs) {
          const k = (now - formingT0 - g.delay) / g.dur;
          if (k < 0) { allDone = false; continue; }
          if (k < 1) {
            allDone = false;
            const e = easeOutCubic(k);
            g.x = g.sx + (g.tx - g.sx) * e;
            g.y = g.sy + (g.ty - g.sy) * e;
            g.trail.push({ x: g.x, y: g.y });
            if (g.trail.length > 6) g.trail.shift();
          } else {
            g.x = g.tx;
            g.y = g.ty;
          }
        }
        if (allDone) {
          phase = 'formed';
          glyphs.forEach((g) => { g.trail = []; });
          nextExcAt = now + 4000 + Math.random() * 3000;
          setFormed(true); // 铭牌/desc 延迟 0.3s 淡入
        }
      }

      // scattering 飞散插值（k² 加速离场，顺流星雨方向往左下）
      if (animate && phase === 'scattering') {
        let allDone = true;
        for (const g of glyphs) {
          const k = (now - scatterT0 - g.delay) / g.dur;
          if (k < 0) { allDone = false; continue; }
          if (k < 1) {
            allDone = false;
            const e = k * k;
            g.x = g.sx + (g.ex - g.sx) * e;
            g.y = g.sy + (g.ey - g.sy) * e;
            g.trail.push({ x: g.x, y: g.y });
            if (g.trail.length > 6) g.trail.shift();
          } else {
            g.x = g.ex;
            g.y = g.ey;
          }
        }
        if (allDone) {
          phase = 'ambient';
          glyphs.forEach((g) => { g.trail = []; });
        }
      }

      // formed：每 4-7s 一颗飞出再归位（1.5s 往返弧线）
      if (animate && phase === 'formed') {
        if (excT0 === 0 && now > nextExcAt && glyphs.length > 0) {
          excIdx = Math.floor(Math.random() * glyphs.length);
          excT0 = now;
          const ang = Math.PI * (0.7 + Math.random() * 0.15);
          const dist = 70 + Math.random() * 90;
          excDx = Math.cos(ang) * dist;
          excDy = Math.sin(ang) * dist;
        }
        if (excT0 > 0) {
          const k = (now - excT0) / 1500;
          const g = glyphs[excIdx];
          if (k >= 1 || !g) {
            if (g) { g.x = g.tx; g.y = g.ty; }
            excT0 = 0;
            excIdx = -1;
            nextExcAt = now + 4000 + Math.random() * 3000;
          } else {
            const arc = Math.sin(k * Math.PI);
            g.x = g.tx + excDx * arc;
            g.y = g.ty + excDy * arc;
          }
        }
      }

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      let curFont = '';
      glyphs.forEach((g, i) => {
        const f = `${g.size}px serif`;
        if (f !== curFont) {
          ctx!.font = f;
          curFont = f;
        }
        if (phase === 'forming' || phase === 'scattering') {
          const t0 = phase === 'forming' ? formingT0 : scatterT0;
          const k = (now - t0 - g.delay) / g.dur;
          if (k < 0) return; // 尚未启程
          if (k < 1 && g.trail.length > 1) {
            g.trail.forEach((tp, ti) => {
              const a = ((ti + 1) / g.trail.length) * 0.25;
              ctx!.fillStyle = `rgba(${rgb},${a.toFixed(3)})`;
              ctx!.fillText(g.text, tp.x, tp.y);
            });
          }
          ctx!.fillStyle = k < 1 ? `rgba(${COPPER},0.95)` : main;
          ctx!.fillText(g.text, g.x, g.y);
        } else {
          const flying = i === excIdx && excT0 > 0;
          const flicker = animate
            ? 0.72 + 0.28 * Math.sin(now * 0.002 * g.tw + g.phase)
            : 0.9;
          ctx!.fillStyle = flying ? `rgba(${COPPER},0.95)` : main;
          ctx!.globalAlpha = flying ? 1 : flicker;
          ctx!.fillText(g.text, g.x, g.y);
          ctx!.globalAlpha = 1;
        }
      });
    }

    function draw(now: number, animate: boolean) {
      if (!ctx || !canvas) return;
      const { main, rgb, groundRgb, groundA: gA, isDark } = colors();
      const geom = horizonGeom();
      ctx.clearRect(0, 0, W, H);

      // 地平线成形度（圆触及地平线后，地面/铜光/望远镜淡入常驻）
      const groundA = clamp01((scrollT - 0.55) / 0.45);
      // 尾部衔接：center center → bottom top，地面整体下沉 ~15%H 并淡出
      const sinkY = settleT * H * 0.15;
      const landA = groundA * (1 - settleT);

      ctx.save();
      if (sinkY > 0) ctx.translate(0, sinkY);
      if (landA > 0) fillGround(geom, groundRgb, gA, landA, H - sinkY);
      strokeArc(geom, main, 1, 0.55 * (1 - settleT)); // 圆 → 地平线弧
      if (landA > 0) {
        strokeArc(geom, `rgba(${COPPER},1)`, 1, 0.4 * landA, -2); // 弧线上缘铜橙微光
        strokeArc(geom, `rgba(${COPPER},1)`, 5, 0.1 * landA, -4);
      }
      drawScope(now, geom, landA, animate, main);
      drawToolbox(now, geom, landA, animate, main, isDark);
      ctx.restore();

      drawMeteors(now, animate, rgb);
      drawGlyphs(now, animate, main, rgb);

      if (animate) lastFrame = now;
    }

    /* ── 望远镜拖拽（仅桌面鼠标，不影响触摸滚动） ─────────── */

    function onPointerDown(e: PointerEvent) {
      if (e.pointerType !== 'mouse') return;
      if ((e.target as HTMLElement | null)?.closest('a')) return; // 不拦截入口 Link
      dragging = true;
      dragId = e.pointerId;
      dragX0 = e.clientX;
      dragY0 = e.clientY;
      azT = azCur; // 从当前指向接续
      altT = altCur;
      azStart = azT;
      altStart = altT;
    }

    function onPointerMove(e: PointerEvent) {
      if (!dragging || e.pointerId !== dragId) return;
      azT = Math.max(105, Math.min(255, azStart + (e.clientX - dragX0) * 0.2));
      altT = Math.max(15, Math.min(75, altStart - (e.clientY - dragY0) * 0.15));
    }

    function onPointerUp(e: PointerEvent) {
      if (!dragging || e.pointerId !== dragId) return;
      dragging = false;
      resumeAt = performance.now() + 4000; // 保持新指向，4s 后缓慢回归
    }

    /* ── 主循环与生命周期 ───────────────────────────────── */

    build();
    let cancelled = false;
    document.fonts?.ready.then(() => { if (!cancelled && phase === 'ambient') build(); });

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
      // 静态绘制一帧成形场景（地平线 + 成形标题 + 望远镜）
      draw(0, false);
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

      // 标题成形/飞散：只对标题粒子目标区（不可见锚点）判定——
      // 标题区离开视口即飞散，重新可见（比例≥0.55 或任一可见）即坠落成形；
      // 进入重新实例化、离开消解、回流重新成形，绝不倒放
      const phaseObserver = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          const now = performance.now();
          if (entry.isIntersecting) startForming(now);
          else startScattering(now);
        },
        { threshold: [0, 0.55] },
      );
      phaseObserver.observe(titleZone);
      cleanups.push(() => phaseObserver.disconnect());

      // 兜底：挂载时标题区若已在视口内（深链/刷新直达），立即成形
      {
        const r = titleZone.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) startForming(performance.now());
      }

      // 工具箱自动开合：锚点进视口 ≥50% 重播开箱、<50% 合盖（状态机，绝不倒放；
      // 注意不能看 isIntersecting——ratio>0 时它恒为 true，必须按 intersectionRatio 判定）
      const toolboxObserver = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          setLid(entry.intersectionRatio >= 0.5, performance.now());
        },
        { threshold: 0.5 },
      );
      toolboxObserver.observe(toolboxZone);
      cleanups.push(() => toolboxObserver.disconnect());

      // 兜底：挂载时工具箱锚点若已过半在视口内，直接开箱
      {
        const r = toolboxZone.getBoundingClientRect();
        const vis = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
        if (vis >= r.height * 0.5) setLid(true, performance.now());
      }

      const gsapCtx = gsap.context(() => {
        // 圆 → 地平线弧
        ScrollTrigger.create({
          trigger: section,
          start: 'top bottom',
          end: 'center center',
          scrub: true,
          onUpdate: (self) => { scrollT = self.progress; },
        });
        // 尾部衔接：地面沉降淡出
        ScrollTrigger.create({
          trigger: section,
          start: 'center center',
          end: 'bottom top',
          scrub: true,
          onUpdate: (self) => { settleT = self.progress; },
        });
      }, section);
      cleanups.push(() => gsapCtx.revert());

      wrap.addEventListener('pointerdown', onPointerDown);
      wrap.addEventListener('pointermove', onPointerMove);
      wrap.addEventListener('pointerup', onPointerUp);
      wrap.addEventListener('pointercancel', onPointerUp);
      cleanups.push(() => {
        wrap.removeEventListener('pointerdown', onPointerDown);
        wrap.removeEventListener('pointermove', onPointerMove);
        wrap.removeEventListener('pointerup', onPointerUp);
        wrap.removeEventListener('pointercancel', onPointerUp);
      });
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
    <section ref={sectionRef} className="relative w-full overflow-hidden">
      <div
        ref={wrapRef}
        className="relative w-full cursor-grab active:cursor-grabbing"
        style={{ height: '78vh' }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          aria-hidden="true"
        />

        {/* 标题粒子目标区的不可见锚点：KNOWLEDGE 成形/消散只按此区进出视口判定
            （与 sampleTargets 区域同位：cx 50% / cy 30%，范围 72%×32%） */}
        <div
          ref={titleZoneRef}
          aria-hidden="true"
          className="absolute pointer-events-none opacity-0"
          style={{ left: '14%', width: '72%', top: 'calc(30% - 16%)', height: '32%' }}
        />

        {/* 工具箱自动开合锚点：进视口 ≥50% 开箱、离视口合盖（覆盖 0.765W 地平线处的线框区） */}
        <div
          ref={toolboxZoneRef}
          aria-hidden="true"
          className="absolute pointer-events-none opacity-0"
          style={{ left: '72.5%', width: '8%', top: '62%', height: '14%' }}
        />

        {/* 中文铭牌 + 描述：KNOWLEDGE 正下方居中，组装完成 0.3s 后淡入，划走先淡没 */}
        <div
          className={`scene-caption absolute z-10 pointer-events-none text-center${formed ? ' is-formed' : ''}`}
          style={{ left: '50%', top: 'calc(30% + 5rem)' }}
        >
          <p className="label-plate mb-3">{title}</p>
          <p className="text-[13px] text-secondary-foreground/80 leading-relaxed max-w-[320px] mx-auto">
            {desc}
          </p>
        </div>

        {/* 主题入口：望远镜旁地面上的 3D 线框工具箱（canvas 自绘，此处为透明点击区；
            hover 线框提亮加粗 + 「进入学科知识 →」文字浮现） */}
        <Link
          to={link}
          className="toolbox-entry absolute z-10 block"
          style={{ left: '76.5%', top: 'calc(75% - 84px)', width: '110px', height: '92px', transform: 'translateX(-50%)' }}
          aria-label={linkText}
          onMouseEnter={() => { toolboxHoverRef.current = true; }}
          onMouseLeave={() => { toolboxHoverRef.current = false; }}
        >
          <span className="toolbox-text label-plate" aria-hidden="true">
            {linkText}
            <span aria-hidden="true"> →</span>
          </span>
        </Link>
      </div>

      <style>{`
        /* 铭牌/desc：成形后延迟 0.3s 淡入；划走立即淡没 */
        .scene-caption {
          opacity: 0;
          transform: translate(-50%, 6px);
          transition: opacity 0.5s cubic-bezier(0.455, 0.03, 0.515, 0.955),
            transform 0.5s cubic-bezier(0.455, 0.03, 0.515, 0.955);
        }
        .scene-caption.is-formed {
          opacity: 1;
          transform: translate(-50%, 0);
          transition-delay: 0.3s;
        }

        /* 工具箱入口：线框本体在 canvas 自绘；hover 仅负责文字浮现（前景色，不用铜橙），
           线框提亮由 canvas 读取 hoverRef 完成 */
        .toolbox-text {
          position: absolute;
          left: 50%;
          top: -0.6rem;
          transform: translate(-50%, 4px);
          white-space: nowrap;
          color: rgb(11, 21, 51);
          opacity: 0;
          transition: opacity 0.5s cubic-bezier(0.455, 0.03, 0.515, 0.955),
            transform 0.5s cubic-bezier(0.455, 0.03, 0.515, 0.955);
          pointer-events: none;
        }
        .dark .toolbox-text {
          color: #fff;
        }
        .toolbox-entry:hover .toolbox-text {
          opacity: 1;
          transform: translate(-50%, 0);
        }
      `}</style>
    </section>
  );
}
