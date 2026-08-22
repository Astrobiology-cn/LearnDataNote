import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import gsap from 'gsap';
import { readCanvasTheme, observeCanvasTheme } from '../../../lib/canvasTheme';

/**
 * ScholarsScene — 学者信息 section 场景组件.
 *
 * 星野：银河带（左上→中右缓弧）拒绝采样 + 边缘衰减 + 三层亮度；
 * 带内排布一套预设星座（模块级随机，10 套选 1，刷新才换），星座为
 * 真实星位归一化模板（相对星形取自 J2000 赤道坐标换算，alpha ≈0.15），
 * 背景星之间不再连网，留出大片纯净星空。
 *
 * 标题：标题目标区（探针锚点）进视口 55% 时 ~1000 颗星被"点名"飞向 'SCHOLARS' 点阵
 * （离屏 `700 110px "Noto Serif SC", serif`、letterSpacing 0.08em 采样，
 * 与三幕衬线显示字体统一），字母星 r≈2.2px、亮度 +30%；字母内不再连线，
 * 纯密集点阵成字（点阵够密时字形自明，去掉蛇形连线的网格感）。
 * 标题宽约束 0.72W、高 0.32H、水平居中。ratio < 0.25 划走时字母星
 * 带短航迹飞回星海原位，再次进入重新点名。
 *
 * 入口：场景水平中轴线上固定北斗七星（真实比例，斗勺四星 + 斗柄三星
 * 弧排，摇光略亮；R4 再放大至 min(0.30W, 560)）。常态以极淡主色折线连出
 * 勺形（读出星座轮廓，不再是 7 粒孤点）；自摇光沿斗柄弧势向右下延长一条
 * 更淡的「循弧见大角」过渡弧（R5），末端缀一颗稍亮回响星，把视线引向下幕；
 * hover 七星包围盒时斗身→斗柄逐段点亮铜橙（每段 150ms），下方浮现
 * "进入学者信息"（react-router Link）；离开 hover（或标题散掉）时逐段熄灭。
 * 北斗无星区半径 R5 收紧为 scale*0.5+40（≈320px，恰好罩住勺形；旧值
 * 554px 挖空下半幕，是幕间空带主因）。
 *
 * 中文铭牌 + desc 位于 SCHOLARS 正下方同轴居中，组装完成后淡入、
 * 划走先淡没。场景入场星野淡入为时间驱动（进入视口即起 ~1.4s
 * easeOutCubic，离开 ~0.9s 反向），与滚动速度解耦。
 *
 * 铜橙只给 hover 北斗与鼠标触碰星；取色走 CSS 变量（lib/canvasTheme.ts，
 * MutationObserver 监听 .dark 切换）；IntersectionObserver 离屏暂停 rAF
 * （迟滞阈值 0.1）；prefers-reduced-motion 静态成形帧。
 */

type Props = {
  title: string;
  desc: string;
  link: string;
  linkText: string;
};

const TITLE_TEXT = 'SCHOLARS';
const FIELD_STARS = 900; // 银河带漂移星
const CLUSTER_STARS = 350; // 标题区伏笔星团（总量 > LETTER_COUNT，成形后星空不空场）
const LETTER_COUNT = 1000; // 被"点名"飞向字母的星数（密集点阵成字，上限 ~1200）
const LETTER_R = 2.2; // 字母星半径（背景星 ~1.2）
const DIP_SEG_MS = 150; // 北斗逐段连线时长 (ms)
const DIP_OFF_MS = 90; // 北斗逐段熄灭间隔 (ms)
const FADE_MS = 500; // 所有淡入淡出统一时长 (ms)
const FORM_DUR = 1200; // 点名迁徙成形时长统一 1.2s
const FORM_STAGGER = 4; // 点名启程错峰 (ms)——1000 颗字母星下 8ms 会拖到 ~9s，4ms 回到 ~5s 节奏

const REDUCED_MOTION =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

type Phase = 'ambient' | 'forming' | 'formed' | 'dispersing';
type DipMode = 'idle' | 'lighting' | 'lit' | 'extinguishing';

type Pt = { x: number; y: number };

type Star = {
  x: number;
  y: number;
  hx: number; // 背景家园位置（被点名时记录，散去时飞回）
  hy: number;
  vx: number;
  vy: number;
  r: number;
  baseA: number; // 亮度层级基准 alpha
  phase: number; // 闪烁相位
  tw: number;
  // 字母星
  letter: boolean;
  tIdx: number; // 对应的目标点索引（-1 无）
  tx: number;
  ty: number;
  sx: number; // 飞行起点
  sy: number;
  delay: number;
  dur: number;
  arc: number; // 抛物线隆起高度 (px)
  trail: Pt[]; // 航迹
};

type CStar = { x: number; y: number; r: number; baseA: number; phase: number; tw: number };

/* ═══════════════════════════════════════════════════════════════════
   星座模板库 — 真实星位归一化坐标（中心近似原点，跨度 ~1.0，y 向下）
   相对星形由主要亮星的 J2000 赤道坐标（RA/Dec）投影换算：x 随 RA 增大、
   y 取赤纬反向（北在上），并按 RA/Dec 跨度比做纵横校正，保留真实形状；
   chain 为折线链（索引序列，允许重复经过关节点，-1 表示抬笔另起一段），
   连线顺序按常见星图连法。
   ═══════════════════════════════════════════════════════════════════ */

type CTemplate = { stars: Pt[]; chain: number[] };

const TEMPLATES: CTemplate[] = [
  // 0 仙后座 W：王良一(β)–王良四(α)–策(γ)–阁道三(δ)–阁道二(ε)
  {
    stars: [
      { x: -0.5, y: 0.07 }, { x: -0.2, y: 0.25 }, { x: -0.05, y: -0.04 },
      { x: 0.23, y: -0.01 }, { x: 0.5, y: -0.25 },
    ],
    chain: [0, 1, 2, 3, 4],
  },
  // 1 猎户：参宿四/参宿五(肩)、腰带三星(参宿一二三)、参宿六/参宿七(膝)
  //    0 Betelgeuse 1 Bellatrix 2 Alnitak 3 Alnilam 4 Mintaka 5 Saiph 6 Rigel
  {
    stars: [
      { x: 0.5, y: -0.3 }, { x: -0.24, y: -0.26 }, { x: 0.15, y: 0.03 },
      { x: 0.03, y: 0.0 }, { x: -0.07, y: -0.03 }, { x: 0.32, y: 0.3 },
      { x: -0.5, y: 0.25 },
    ],
    chain: [3, 2, 0, 1, 4, 3, 2, 5, 6, 4],
  },
  // 2 天琴：织女(α) + 渐台(β/γ) 平行四边形；0 Vega 1 ε 2 ζ 3 Sheliak 4 Sulafat 5 δ
  {
    stars: [
      { x: -0.5, y: -0.3 }, { x: -0.16, y: -0.4 }, { x: -0.14, y: -0.17 },
      { x: 0.1, y: 0.32 }, { x: 0.5, y: 0.4 }, { x: 0.3, y: -0.09 },
    ],
    chain: [1, 0, 2, 3, 4, 5, 2],
  },
  // 3 天鹅 北十字：0 Deneb 1 Sadr 2 Gienah(ε) 3 δ 4 Albireo（抬笔分横臂）
  {
    stars: [
      { x: 0.44, y: -0.5 }, { x: 0.18, y: -0.21 }, { x: 0.5, y: 0.15 },
      { x: -0.31, y: -0.49 }, { x: -0.5, y: 0.5 },
    ],
    chain: [4, 1, 0, -1, 3, 1, 2],
  },
  // 4 天蝎：0 Acrab 1 Dschubba 2 Antares 3 τ 4 ε 5 η 6 Sargas 7 ι 8 Shaula 9 Lesath
  {
    stars: [
      { x: -0.45, y: -0.5 }, { x: -0.5, y: -0.38 }, { x: -0.23, y: -0.22 },
      { x: -0.17, y: -0.14 }, { x: -0.03, y: 0.12 }, { x: 0.17, y: 0.5 },
      { x: 0.41, y: 0.49 }, { x: 0.46, y: 0.37 }, { x: 0.37, y: 0.24 },
      { x: 0.34, y: 0.25 },
    ],
    chain: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  },
  // 5 南十字：0 Acrux 1 Mimosa 2 Gacrux 3 δ（长轴 + 横臂，抬笔分开）
  {
    stars: [
      { x: -0.15, y: 0.68 }, { x: 0.5, y: -0.1 }, { x: -0.01, y: -0.68 },
      { x: -0.5, y: -0.31 },
    ],
    chain: [2, 0, -1, 3, 1],
  },
  // 6 狮子 镰刀：0 Regulus 1 η 2 Algieba 3 Adhafera 4 Ras Elased 5 ε（反问号）
  {
    stars: [
      { x: 0.17, y: 0.31 }, { x: 0.13, y: 0.1 }, { x: 0.5, y: -0.04 },
      { x: 0.41, y: -0.19 }, { x: -0.29, y: -0.31 }, { x: -0.5, y: -0.21 },
    ],
    chain: [0, 1, 2, 3, 4, 5],
  },
  // 7 飞马 大四边形：0 Markab 1 Scheat 2 Algenib 3 Alpheratz（闭合）
  {
    stars: [
      { x: -0.49, y: 0.63 }, { x: -0.5, y: -0.54 }, { x: 0.5, y: 0.63 },
      { x: 0.43, y: -0.63 },
    ],
    chain: [0, 1, 3, 2, 0],
  },
  // 8 天鹰：0 ζ 1 Tarazed 2 牛郎 Altair 3 Alshain 4 θ（雁列）
  {
    stars: [
      { x: -0.5, y: -0.55 }, { x: 0.12, y: -0.31 }, { x: 0.19, y: -0.18 },
      { x: 0.26, y: 0.01 }, { x: 0.5, y: 0.55 },
    ],
    chain: [0, 1, 2, 3, 4],
  },
  // 9 金牛 毕宿 V：0 γ 1 δ 2 Ain(ε) 3 θ 4 毕宿五 Aldebaran（V 一臂延伸）
  {
    stars: [
      { x: -0.5, y: 0.57 }, { x: -0.32, y: 0.1 }, { x: 0.06, y: -0.57 },
      { x: 0.06, y: 0.49 }, { x: 0.5, y: 0.29 },
    ],
    chain: [2, 1, 0, 3, 4],
  },
  // 10 北冕 弧形：θ–β(Nusakan)–α(Alphecca)–γ–δ–ε 半环
  {
    stars: [
      { x: -0.32, y: -0.71 }, { x: -0.5, y: -0.11 }, { x: -0.26, y: 0.54 },
      { x: 0.0, y: 0.65 }, { x: 0.24, y: 0.71 }, { x: 0.5, y: 0.49 },
    ],
    chain: [0, 1, 2, 3, 4, 5],
  },
  // 11 北斗七星（大熊）：同 DIPPER_STARS 真实比例，链 斗柄→斗勺→封口
  {
    stars: [
      { x: 0.05, y: -0.02 }, { x: -0.25, y: -0.1 }, { x: -0.28, y: 0.12 },
      { x: 0.02, y: 0.14 }, { x: 0.22, y: -0.06 }, { x: 0.38, y: -0.02 },
      { x: 0.55, y: 0.06 },
    ],
    chain: [6, 5, 4, 0, 3, 2, 1, 0],
  },
];

/* 10 套星座组合：t=模板索引，ax/ay=场景归一化位置（避开标题区与北斗区，
   沿银河带两侧疏密排布），s=尺度(px)，rot=旋转(rad) */
type CPlacement = { t: number; ax: number; ay: number; s: number; rot: number };

const CONSTELLATION_SETS: CPlacement[][] = [
  // 0 仙后 + 猎户 + 天琴 + 北十字 + 天蝎 + 北冕
  [
    { t: 0, ax: 0.17, ay: 0.1, s: 95, rot: -0.2 },
    { t: 1, ax: 0.91, ay: 0.22, s: 110, rot: 0.15 },
    { t: 2, ax: 0.05, ay: 0.62, s: 70, rot: 0.4 },
    { t: 3, ax: 0.86, ay: 0.8, s: 100, rot: -0.3 },
    { t: 4, ax: 0.3, ay: 0.62, s: 90, rot: 0.2 },
    { t: 10, ax: 0.8, ay: 0.14, s: 65, rot: 0 },
  ],
  // 1 狮子 + 飞马 + 金牛 + 南十字 + 天鹰 + 仙后
  [
    { t: 6, ax: 0.29, ay: 0.12, s: 110, rot: -0.15 },
    { t: 7, ax: 0.93, ay: 0.4, s: 100, rot: 0.2 },
    { t: 9, ax: 0.1, ay: 0.82, s: 85, rot: 0.1 },
    { t: 5, ax: 0.8, ay: 0.14, s: 60, rot: -0.2 },
    { t: 8, ax: 0.3, ay: 0.62, s: 90, rot: 0.3 },
    { t: 0, ax: 0.7, ay: 0.74, s: 80, rot: -0.4 },
  ],
  // 2 天蝎 + 天琴 + 猎户 + 北冕 + 北十字 + 金牛
  [
    { t: 4, ax: 0.42, ay: 0.1, s: 120, rot: 0.1 },
    { t: 2, ax: 0.06, ay: 0.42, s: 65, rot: -0.3 },
    { t: 1, ax: 0.9, ay: 0.58, s: 105, rot: -0.1 },
    { t: 10, ax: 0.24, ay: 0.72, s: 70, rot: 0.2 },
    { t: 3, ax: 0.68, ay: 0.11, s: 95, rot: 0.15 },
    { t: 9, ax: 0.86, ay: 0.8, s: 80, rot: -0.2 },
  ],
  // 3 飞马 + 天鹰 + 狮子 + 南十字 + 仙后 + 天琴
  [
    { t: 7, ax: 0.07, ay: 0.14, s: 105, rot: 0.1 },
    { t: 8, ax: 0.91, ay: 0.22, s: 95, rot: -0.25 },
    { t: 6, ax: 0.05, ay: 0.62, s: 100, rot: 0.35 },
    { t: 5, ax: 0.68, ay: 0.62, s: 55, rot: 0.1 },
    { t: 0, ax: 0.55, ay: 0.09, s: 85, rot: -0.1 },
    { t: 2, ax: 0.1, ay: 0.82, s: 70, rot: 0.25 },
  ],
  // 4 金牛 + 北十字 + 北冕 + 天蝎 + 飞马 + 天鹰
  [
    { t: 9, ax: 0.29, ay: 0.12, s: 95, rot: -0.2 },
    { t: 3, ax: 0.93, ay: 0.4, s: 105, rot: 0.1 },
    { t: 10, ax: 0.06, ay: 0.42, s: 60, rot: 0.3 },
    { t: 4, ax: 0.7, ay: 0.74, s: 100, rot: -0.15 },
    { t: 7, ax: 0.8, ay: 0.14, s: 95, rot: 0.2 },
    { t: 8, ax: 0.1, ay: 0.82, s: 85, rot: 0 },
  ],
  // 5 猎户 + 狮子 + 南十字 + 天琴 + 仙后 + 金牛
  [
    { t: 1, ax: 0.17, ay: 0.1, s: 100, rot: 0.2 },
    { t: 6, ax: 0.91, ay: 0.22, s: 110, rot: -0.1 },
    { t: 5, ax: 0.3, ay: 0.62, s: 58, rot: 0.15 },
    { t: 2, ax: 0.9, ay: 0.58, s: 68, rot: -0.35 },
    { t: 0, ax: 0.24, ay: 0.72, s: 82, rot: 0.1 },
    { t: 9, ax: 0.68, ay: 0.11, s: 88, rot: -0.2 },
  ],
  // 6 天鹰 + 北冕 + 飞马 + 天蝎 + 北十字 + 猎户
  [
    { t: 8, ax: 0.42, ay: 0.1, s: 98, rot: 0.15 },
    { t: 10, ax: 0.93, ay: 0.4, s: 62, rot: -0.2 },
    { t: 7, ax: 0.05, ay: 0.62, s: 102, rot: 0.3 },
    { t: 4, ax: 0.8, ay: 0.14, s: 108, rot: 0.05 },
    { t: 3, ax: 0.1, ay: 0.82, s: 92, rot: -0.25 },
    { t: 1, ax: 0.68, ay: 0.62, s: 100, rot: 0.1 },
  ],
  // 7 仙后 + 金牛 + 天琴 + 狮子 + 南十字 + 天鹰 + 北冕
  [
    { t: 0, ax: 0.07, ay: 0.14, s: 90, rot: 0.25 },
    { t: 9, ax: 0.91, ay: 0.22, s: 92, rot: -0.15 },
    { t: 2, ax: 0.3, ay: 0.62, s: 66, rot: 0.2 },
    { t: 6, ax: 0.86, ay: 0.8, s: 108, rot: -0.3 },
    { t: 5, ax: 0.55, ay: 0.09, s: 56, rot: 0.1 },
    { t: 8, ax: 0.9, ay: 0.58, s: 94, rot: -0.2 },
    { t: 10, ax: 0.06, ay: 0.42, s: 60, rot: 0.15 },
  ],
  // 8 飞马 + 天蝎 + 猎户 + 北十字 + 金牛 + 天琴
  [
    { t: 7, ax: 0.29, ay: 0.12, s: 104, rot: -0.1 },
    { t: 4, ax: 0.93, ay: 0.4, s: 112, rot: 0.2 },
    { t: 1, ax: 0.1, ay: 0.82, s: 98, rot: -0.2 },
    { t: 3, ax: 0.8, ay: 0.14, s: 96, rot: 0.25 },
    { t: 9, ax: 0.05, ay: 0.62, s: 86, rot: 0.05 },
    { t: 2, ax: 0.7, ay: 0.74, s: 70, rot: -0.3 },
  ],
  // 9 狮子 + 天鹰 + 北冕 + 仙后 + 南十字 + 天蝎 + 飞马
  [
    { t: 6, ax: 0.17, ay: 0.1, s: 106, rot: 0.2 },
    { t: 8, ax: 0.91, ay: 0.22, s: 92, rot: -0.3 },
    { t: 10, ax: 0.3, ay: 0.62, s: 64, rot: 0.1 },
    { t: 0, ax: 0.9, ay: 0.58, s: 88, rot: -0.15 },
    { t: 5, ax: 0.24, ay: 0.72, s: 58, rot: 0.2 },
    { t: 4, ax: 0.68, ay: 0.11, s: 110, rot: -0.05 },
    { t: 7, ax: 0.86, ay: 0.8, s: 96, rot: 0.15 },
  ],
];

/** 模块级随机：每次页面加载选一套，session 内不变、刷新才换 */
const ACTIVE_SET = CONSTELLATION_SETS[Math.floor(Math.random() * CONSTELLATION_SETS.length)];

/* 北斗七星（入口）：真实比例 —— 斗勺四星 + 斗柄三星弧排，摇光(6)略亮 */
const DIPPER_STARS: Pt[] = [
  { x: 0.05, y: -0.02 }, // 0 天权（斗勺-斗柄连接）
  { x: -0.25, y: -0.1 }, // 1 天枢
  { x: -0.28, y: 0.12 }, // 2 天璇
  { x: 0.02, y: 0.14 }, // 3 天玑
  { x: 0.22, y: -0.06 }, // 4 玉衡
  { x: 0.38, y: -0.02 }, // 5 开阳
  { x: 0.55, y: 0.06 }, // 6 摇光（端星，略亮）
];
/** 斗身 4 段 → 斗柄 3 段，逐段连线顺序 */
const DIPPER_SEGS: Array<[number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 0], // 斗勺
  [0, 4], [4, 5], [5, 6], // 斗柄
];
const DIPPER_PHASES = DIPPER_STARS.map((_, i) => i * 1.7);

/** 离屏渲染文字并按自适应步长采样目标点阵（点数 ≤ maxPts） */
function sampleLetters(
  text: string,
  maxPts: number,
): { pts: Pt[]; w: number; h: number; step: number } {
  const off = document.createElement('canvas');
  const octx = off.getContext('2d', { willReadFrequently: true });
  if (!octx) return { pts: [], w: 1, h: 1, step: 6 };

  const font = '700 110px "Noto Serif SC", serif'; // 三幕统一衬线显示字体
  octx.font = font;
  octx.letterSpacing = '0.08em';
  const textW = Math.max(octx.measureText(text).width, 1);
  const textH = 150;

  off.width = Math.ceil(textW) + 20;
  off.height = textH;
  octx.font = font;
  octx.letterSpacing = '0.08em'; // canvas 尺寸重置后状态清空，需重设
  octx.fillStyle = '#fff';
  octx.textBaseline = 'middle';
  octx.fillText(text, 10, textH / 2);

  const img = octx.getImageData(0, 0, off.width, off.height).data;

  const count = (s: number) => {
    let n = 0;
    for (let y = 0; y < off.height; y += s)
      for (let x = 0; x < off.width; x += s)
        if (img[(y * off.width + x) * 4 + 3] > 128) n++;
    return n;
  };
  let step = 4; // 从更细的步长起搜，密度优先（超上限再逐步加粗）
  while (count(step) > maxPts && step < 40) step += 1;

  const pts: Pt[] = [];
  for (let y = 0; y < off.height; y += step) {
    for (let x = 0; x < off.width; x += step) {
      if (img[(y * off.width + x) * 4 + 3] > 128) {
        pts.push({ x, y });
      }
    }
  }
  return { pts, w: off.width, h: textH, step };
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function clamp01(v: number) {
  return Math.min(Math.max(v, 0), 1);
}

/** cubic-bezier(0.455,0.03,0.515,0.955)（--ease-fade）求解器：所有淡入淡出统一缓动 */
function cubicBezier(p1x: number, p1y: number, p2x: number, p2y: number) {
  const bx = (u: number) => 3 * (1 - u) * (1 - u) * u * p1x + 3 * (1 - u) * u * u * p2x + u * u * u;
  const by = (u: number) => 3 * (1 - u) * (1 - u) * u * p1y + 3 * (1 - u) * u * u * p2y + u * u * u;
  return (t: number) => {
    let lo = 0;
    let hi = 1;
    let u = t;
    for (let i = 0; i < 24; i++) {
      u = (lo + hi) / 2;
      if (bx(u) < t) lo = u;
      else hi = u;
    }
    return by(u);
  };
}
const easeFade = cubicBezier(0.455, 0.03, 0.515, 0.955);

export default function ScholarsScene({ title, desc, link, linkText }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // 标题粒子目标区探针：与采样点阵同位，phaseObserver 据此判定成形/飞散
  const titleProbeRef = useRef<HTMLDivElement>(null);
  // 组装完成 → 铭牌淡入；划走 → 先淡没
  const [assembled, setAssembled] = useState(REDUCED_MOTION);
  // hover 北斗 → 浮现入口文字
  const [dipperHover, setDipperHover] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = 0;
    let H = 0;
    let stars: Star[] = [];
    let constellations: Array<{ pts: CStar[]; chain: number[] }> = [];
    let targets: Pt[] = [];
    let dip: Pt[] = []; // 北斗七星屏幕坐标
    let dipBBox = { x0: 0, y0: 0, x1: 0, y1: 0 };
    let dipMode: DipMode = 'idle'; // 铜橙仅由 hover 点亮（lighting→lit），无常态点亮
    let dipT0 = 0;
    let dipHover = false;
    let phase: Phase = 'ambient';
    let formingT0 = 0;
    let dispersingT0 = 0;
    let animationId = 0;
    let running = false;
    const mouse = { x: -1000, y: -1000 };
    // 北斗无星区（漂移星软推离）
    let exX = 0;
    let exY = 0;
    let exR = 130;
    // 场景入场淡入因子（时间驱动，见下方 fadeObserver；reduced-motion 恒 1）
    const fadeObj = { v: REDUCED_MOTION ? 1 : 0 };

    /** 银河带中线：左上 → 中右的缓和对角弧 */
    function bandY(x: number) {
      return H * 0.22 + (x / Math.max(W, 1)) * H * 0.38 + Math.sin((x / Math.max(W, 1)) * Math.PI) * H * 0.05;
    }

    function makeStar(x: number, y: number): Star {
      // 三层亮度：~8% 亮星 / ~27% 中等 / ~65% 微星（背景星 ~1.2px）
      const roll = Math.random();
      let r: number;
      let baseA: number;
      if (roll < 0.08) {
        r = 1.6 + Math.random() * 0.5;
        baseA = 0.8;
      } else if (roll < 0.35) {
        r = 1.0 + Math.random() * 0.4;
        baseA = 0.55;
      } else {
        r = 0.6 + Math.random() * 0.4;
        baseA = 0.35;
      }
      return {
        x, y, hx: x, hy: y,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.1,
        r, baseA,
        phase: Math.random() * Math.PI * 2,
        tw: (Math.PI * 2) / (3000 + Math.random() * 2000), // 闪烁角速度：周期 3–5s，更慢更安静
        letter: false, tIdx: -1,
        tx: 0, ty: 0, sx: 0, sy: 0,
        delay: 0, dur: 900, arc: 0,
        trail: [],
      };
    }

    /** 有设计的星野：银河带密度 × 边缘衰减，拒绝采样 */
    function generateField() {
      stars = [];
      const sigma = H * 0.16;
      const inExclusion = (x: number, y: number) => Math.hypot(x - exX, y - exY) < exR;

      let guard = 0;
      while (stars.length < FIELD_STARS && guard < FIELD_STARS * 60) {
        guard++;
        const x = Math.random() * W;
        const y = Math.random() * H;
        if (inExclusion(x, y)) continue;
        const d = y - bandY(x);
        const band = Math.exp(-(d / sigma) * (d / sigma));
        const ex = 1 - Math.abs(x - W / 2) / (W / 2);
        const ey = 1 - Math.abs(y - H / 2) / (H / 2);
        const edge = 0.35 + 0.65 * Math.pow(Math.max(ex * ey, 0), 0.6);
        const p = (0.1 + 0.9 * band) * edge;
        if (Math.random() < p) stars.push(makeStar(x, y));
      }

      // 标题成形区的"伏笔星团"：稍显拥挤
      if (targets.length > 0) {
        const xs = targets.map((t) => t.x);
        const ys = targets.map((t) => t.y);
        const pad = 50;
        const x0 = Math.max(Math.min(...xs) - pad, 0);
        const x1 = Math.min(Math.max(...xs) + pad, W);
        const y0 = Math.max(Math.min(...ys) - pad, 0);
        const y1 = Math.min(Math.max(...ys) + pad, H);
        for (let i = 0; i < CLUSTER_STARS; i++) {
          const x = x0 + Math.random() * (x1 - x0);
          const y = y0 + Math.random() * (y1 - y0);
          if (inExclusion(x, y)) continue;
          stars.push(makeStar(x, y));
        }
      }
    }

    /** 星座模板 → 屏幕坐标（沿银河带排布，固定不漂移） */
    function layoutConstellations() {
      constellations = ACTIVE_SET.map((pl) => {
        const tpl = TEMPLATES[pl.t];
        const cos = Math.cos(pl.rot);
        const sin = Math.sin(pl.rot);
        const px = pl.ax * W;
        const py = pl.ay * H;
        return {
          chain: tpl.chain,
          pts: tpl.stars.map((p) => ({
            x: px + (p.x * cos - p.y * sin) * pl.s,
            y: py + (p.x * sin + p.y * cos) * pl.s,
            r: 1.3 + Math.random() * 0.6,
            baseA: 0.55 + Math.random() * 0.25,
            phase: Math.random() * Math.PI * 2,
            tw: (Math.PI * 2) / (3000 + Math.random() * 2000), // 周期 3–5s
          })),
        };
      });
    }

    /** 北斗七星屏幕坐标：水平中轴，铭牌描述下方居中。
     *  R3 放大（scale 上限 120→380）；R4 再放大（380→560，占比 0.26W→0.30W）——
     *  盲测仍报告「字下方约半屏空地」，北斗需承担下半屏的视觉重量 */
    function layoutDipper() {
      const scale = Math.min(W * 0.3, 560);
      const ox = (Math.min(...DIPPER_STARS.map((p) => p.x)) + Math.max(...DIPPER_STARS.map((p) => p.x))) / 2;
      const oy = (Math.min(...DIPPER_STARS.map((p) => p.y)) + Math.max(...DIPPER_STARS.map((p) => p.y))) / 2;
      const cx = W / 2;
      const cy = H * 0.76;
      dip = DIPPER_STARS.map((p) => ({ x: cx + (p.x - ox) * scale, y: cy + (p.y - oy) * scale }));
      const xs = dip.map((p) => p.x);
      const ys = dip.map((p) => p.y);
      dipBBox = {
        x0: Math.min(...xs) - 30,
        y0: Math.min(...ys) - 30,
        x1: Math.max(...xs) + 30,
        y1: Math.max(...ys) + 30,
      };
      exX = cx;
      exY = cy;
      // R5：exR 554 → 320。旧值（scale*0.9+50）以北斗为心挖去半径 ~554px 的星野，
      // 而七星实际半宽仅 ~235px——无星区漫过下半幕直抵幕间带，是
      // 「SCHOLARS 聚成后将近一屏一无所有」的主因；320px 仍完整罩住勺形
      exR = scale * 0.5 + 40;
    }

    function build() {
      if (!canvas || !wrap) return;
      W = wrap.clientWidth;
      H = wrap.clientHeight;
      canvas.width = W;
      canvas.height = H;

      // 采样字母点阵（~1000 点），宽约束 0.72W / 高 0.32H，水平居中于场景中上部
      const { pts, w: rawW, h: rawH } = sampleLetters(TITLE_TEXT, LETTER_COUNT);
      const scale = Math.min((W * 0.72) / rawW, (H * 0.32) / rawH);
      const cx = W / 2;
      const cy = H * 0.36;
      targets = pts.map((p) => ({
        x: cx + (p.x - rawW / 2) * scale,
        y: cy + (p.y - rawH / 2) * scale,
      }));
      layoutConstellations();
      layoutDipper();

      if (stars.length === 0) {
        generateField();
      } else {
        stars.forEach((s) => {
          s.x = Math.min(Math.max(s.x, 0), W);
          s.y = Math.min(Math.max(s.y, 0), H);
          s.hx = Math.min(Math.max(s.hx, 0), W);
          s.hy = Math.min(Math.max(s.hy, 0), H);
        });
      }

      // 已成形时重新点名并吸附（resize / 字体就绪重建）
      if (phase === 'formed') {
        assignTargets();
        stars.forEach((s) => {
          if (s.letter) {
            s.x = s.tx;
            s.y = s.ty;
          }
        });
      }
    }

    /** 点名：随机子集 + 贪婪最近匹配，记录家园位置与目标索引 */
    function assignTargets() {
      stars.forEach((s) => {
        s.letter = false;
        s.tIdx = -1;
        s.trail = [];
      });
      const m = Math.min(LETTER_COUNT, targets.length, stars.length);
      const shuffled = stars.map((_, i) => i).sort(() => Math.random() - 0.5);
      const chosen = shuffled.slice(0, m);

      const assign = (s: number, t: number) => {
        const star = stars[s];
        star.letter = true;
        star.tIdx = t;
        star.tx = targets[t].x;
        star.ty = targets[t].y;
        star.hx = star.x;
        star.hy = star.y;
      };

      // 密度翻倍后全配对排序（1000×1000=1e6 对）太贵：每星先取最近目标，
      // 按该距离升序贪婪占位，被抢目标的星补位剩余目标点
      const best = chosen.map((s) => {
        let bt = 0;
        let bd = Infinity;
        for (let t = 0; t < targets.length; t++) {
          const d = Math.hypot(stars[s].x - targets[t].x, stars[s].y - targets[t].y);
          if (d < bd) {
            bd = d;
            bt = t;
          }
        }
        return { s, t: bt, d: bd };
      });
      best.sort((a, b) => a.d - b.d);
      const usedTarget = new Set<number>();
      const unassigned: number[] = [];
      for (const { s, t } of best) {
        if (usedTarget.has(t)) {
          unassigned.push(s);
          continue;
        }
        usedTarget.add(t);
        assign(s, t);
      }
      if (unassigned.length > 0) {
        const free: number[] = [];
        for (let t = 0; t < targets.length; t++) if (!usedTarget.has(t)) free.push(t);
        unassigned.forEach((s, k) => {
          if (k < free.length) assign(s, free[k]);
        });
      }
    }

    function startForming(now: number) {
      if (phase !== 'ambient') return;
      phase = 'forming';
      formingT0 = now;
      assignTargets(); // 重新点名（全新随机匹配，绝不倒放）
      // 迁徙成形：时长统一 1.2s、stagger 4ms（随机顺序启程，缓动 E-OUT 保持）
      const chosen = stars.filter((s) => s.letter).sort(() => Math.random() - 0.5);
      chosen.forEach((s, k) => {
        s.sx = s.x;
        s.sy = s.y;
        s.delay = k * FORM_STAGGER;
        s.dur = FORM_DUR;
        s.arc = 20 + Math.random() * 50;
      });
    }

    function startDispersing(now: number) {
      if (phase !== 'formed' && phase !== 'forming') return;
      phase = 'dispersing';
      dispersingT0 = now;
      setAssembled(false); // 铭牌先淡没
      if (dipMode === 'lit' || dipMode === 'lighting') {
        dipMode = 'extinguishing'; // 北斗连线逐段熄灭
        dipT0 = now;
      }
      stars.forEach((s) => {
        if (s.letter) {
          s.sx = s.x;
          s.sy = s.y;
          s.delay = Math.random() * 500;
          s.dur = 700 + Math.random() * 600;
          s.arc = 15 + Math.random() * 40;
        }
      });
    }

    // CSS 变量取色（卷二 2.5 规则 1/2）：挂载时读取，.dark 切换经 MutationObserver 重取
    let theme = readCanvasTheme();

    function colors() {
      return {
        isDark: theme.isDark,
        rgb: theme.rgb,
        main: theme.main,
        copper: theme.copper,
      };
    }

    function drift(s: Star) {
      s.x += s.vx;
      s.y += s.vy;
      // 北斗无星区：软推离
      const dx = s.x - exX;
      const dy = s.y - exY;
      const d = Math.hypot(dx, dy);
      if (d < exR && d > 0.01) {
        s.vx += (dx / d) * 0.006;
        s.vy += (dy / d) * 0.006;
        const sp = Math.hypot(s.vx, s.vy);
        const maxSp = 0.2;
        if (sp > maxSp) {
          s.vx = (s.vx / sp) * maxSp;
          s.vy = (s.vy / sp) * maxSp;
        }
      }
      if (s.x < -10) s.x = W + 10;
      if (s.x > W + 10) s.x = -10;
      if (s.y < -10) s.y = H + 10;
      if (s.y > H + 10) s.y = -10;
    }

    function pushTrail(s: Star) {
      s.trail.push({ x: s.x, y: s.y });
      if (s.trail.length > 8) s.trail.shift();
    }

    function drawTrail(s: Star, rgb: string, sf: number) {
      if (!ctx || s.trail.length < 2) return;
      ctx.lineWidth = 0.7;
      for (let i = 1; i < s.trail.length; i++) {
        const a = (i / s.trail.length) * 0.22 * sf;
        ctx.strokeStyle = `rgba(${rgb},${a.toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(s.trail[i - 1].x, s.trail[i - 1].y);
        ctx.lineTo(s.trail[i].x, s.trail[i].y);
        ctx.stroke();
      }
    }

    /** 北斗段进度：lighting 逐段画出 / extinguishing 反向逐段熄灭 */
    function dipSegP(i: number, now: number, animate: boolean) {
      if (!animate) return dipMode === 'lit' ? 1 : 0;
      const n = DIPPER_SEGS.length;
      if (dipMode === 'lit') return 1;
      if (dipMode === 'lighting') return clamp01((now - dipT0 - i * DIP_SEG_MS) / DIP_SEG_MS);
      if (dipMode === 'extinguishing')
        return 1 - clamp01((now - dipT0 - (n - 1 - i) * DIP_OFF_MS) / DIP_SEG_MS);
      return 0;
    }

    function draw(now: number, animate: boolean) {
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);
      const { isDark, rgb, main, copper: COPPER } = colors();
      const sf = fadeObj.v; // 场景入场淡入因子
      if (sf <= 0.001) return;

      // ── 位置更新与状态机 ──
      let allLanded = true;
      let anyLetter = false;
      for (const s of stars) {
        if (!s.letter) {
          if (animate) drift(s);
          continue;
        }
        anyLetter = true;
        if (!animate) {
          allLanded = false;
          continue;
        }
        if (phase === 'forming') {
          const k = (now - (formingT0 + s.delay)) / s.dur;
          if (k <= 0) {
            allLanded = false;
          } else if (k < 1) {
            allLanded = false;
            const e = easeOutCubic(k);
            s.x = s.sx + (s.tx - s.sx) * e;
            s.y = s.sy + (s.ty - s.sy) * e - s.arc * Math.sin(Math.PI * k);
            pushTrail(s);
          } else {
            s.x = s.tx;
            s.y = s.ty;
          }
        } else if (phase === 'dispersing') {
          const k = (now - (dispersingT0 + s.delay)) / s.dur;
          if (k <= 0) {
            // 等待启程
          } else if (k < 1) {
            const e = easeOutCubic(k);
            s.x = s.sx + (s.hx - s.sx) * e;
            s.y = s.sy + (s.hy - s.sy) * e - s.arc * Math.sin(Math.PI * k);
            pushTrail(s);
          } else {
            s.x = s.hx;
            s.y = s.hy;
            s.letter = false;
            s.tIdx = -1;
            s.trail = [];
          }
        } else if (phase === 'formed') {
          s.x = s.tx;
          s.y = s.ty;
        }
      }
      if (animate && phase === 'forming' && allLanded && anyLetter) {
        phase = 'formed';
        setAssembled(true); // 铭牌淡入（北斗不再自动点亮，铜橙仅由 hover 触发）
      }
      if (animate && phase === 'dispersing' && !stars.some((s) => s.letter)) {
        phase = 'ambient';
      }
      if (animate && dipMode === 'lighting' && now - dipT0 > DIPPER_SEGS.length * DIP_SEG_MS) {
        dipMode = 'lit';
      }
      if (animate && dipMode === 'extinguishing' && now - dipT0 > DIPPER_SEGS.length * DIP_OFF_MS + DIP_SEG_MS) {
        dipMode = 'idle';
      }
      // 标题成形/飞散由 IntersectionObserver 阈值驱动（见下方生命周期）

      // ── 星座折线链（alpha ≈0.15，背景星不再连网） ──
      ctx.lineWidth = 0.6;
      const cAlpha = (isDark ? 0.16 : 0.12) * sf;
      ctx.strokeStyle = `rgba(${rgb},${cAlpha.toFixed(3)})`;
      for (const c of constellations) {
        ctx.beginPath();
        let pen = false; // chain 中 -1 表示抬笔另起一段（如北十字横臂、南十字）
        for (const k of c.chain) {
          if (k < 0) {
            pen = false;
            continue;
          }
          const p = c.pts[k];
          if (!p) continue;
          if (!pen) {
            ctx.moveTo(p.x, p.y);
            pen = true;
          } else {
            ctx.lineTo(p.x, p.y);
          }
        }
        ctx.stroke();
      }

      // ── 字母内不连线：密集点阵自成字形（去网格感） ──

      // ── 星座星点（固定，闪烁） ──
      for (const c of constellations) {
        for (const p of c.pts) {
          const dm = Math.hypot(p.x - mouse.x, p.y - mouse.y);
          const boost = Math.max(0, 1 - dm / 120);
          const flicker = animate ? 0.7 + 0.3 * Math.sin(now * p.tw + p.phase) : 0.85;
          const alpha = Math.min((p.baseA * flicker + boost * 0.3) * sf, 1);
          ctx.fillStyle = `rgba(${rgb},${alpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * (1 + boost * 0.4), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ── 漂移星 + 字母星 ──
      for (const s of stars) {
        const dm = Math.hypot(s.x - mouse.x, s.y - mouse.y);
        if (s.letter) {
          // 字母星：r≈2.2、亮度 +30%；鼠标靠近放大变铜橙并连线
          const near = phase === 'formed' ? Math.max(0, 1 - dm / 150) : 0;
          const twinkle = animate
            ? Math.min((0.7 + 0.3 * Math.sin(now * s.tw + s.phase)) * 1.3, 1)
            : 1;
          const r = LETTER_R * (1 + near * 0.8);

          if (s.trail.length > 1) drawTrail(s, rgb, sf);
          ctx.fillStyle =
            near > 0.12 ? `rgba(${COPPER},${Math.min(twinkle + near * 0.5, 1).toFixed(3)})` : main;
          ctx.globalAlpha = twinkle * sf;
          ctx.beginPath();
          ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;

          if (near > 0.05) {
            ctx.globalAlpha = near * 0.6 * sf;
            ctx.strokeStyle = `rgba(${COPPER},1)`;
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        } else {
          // 背景星：按层级亮度闪烁；鼠标划过轻微点亮（不变色）
          const boost = Math.max(0, 1 - dm / 120);
          const flicker = animate ? 0.65 + 0.35 * Math.sin(now * s.tw + s.phase) : 0.8;
          const alpha = Math.min((s.baseA * flicker + boost * 0.35) * sf, 1);
          ctx.fillStyle = `rgba(${rgb},${alpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * (1 + boost * 0.5), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ── 北斗七星（入口） ──
      // 高亮淡入淡出（hover 驱动）：0.5s cubic-bezier(0.455,0.03,0.515,0.955)
      const dipLitF =
        dipMode === 'lit'
          ? 1
          : dipMode === 'lighting'
            ? easeFade(clamp01((now - dipT0) / FADE_MS))
            : dipMode === 'extinguishing'
              ? 1 - easeFade(clamp01((now - dipT0) / FADE_MS))
              : 0;

      // 北斗常态基线（R4）：极淡主色折线连出「勺形」，无 hover 时也可辨认——
      // 此前默认无连线，7 粒孤点在下半屏读作噪点（盲测「字下方半屏空地」）；
      // hover 时铜橙逐段点亮叠加其上，交互层意象不变
      ctx.lineWidth = 0.6;
      ctx.strokeStyle = `rgba(${rgb},${((isDark ? 0.16 : 0.14) * sf).toFixed(3)})`;
      ctx.beginPath();
      for (const [ai, bi] of DIPPER_SEGS) {
        const a = dip[ai];
        const b = dip[bi];
        if (!a || !b) continue;
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
      }
      ctx.stroke();

      // 循斗柄之弧见大角（R5，幕间过渡）：自摇光沿斗柄弧势向右下延长一条
      // 极淡弧线，末端缀一颗稍亮的「大角回响」星——把视线从北斗引向下幕，
      // 填补勺形下方至幕间带上沿的视觉空窗（无星区缩小后此弧承担过渡）
      if (dip.length >= 7) {
        const p6 = dip[6];
        const scale = Math.min(W * 0.3, 560);
        const cArc = { x: p6.x + 0.2 * scale, y: p6.y + 0.05 * scale };
        const eArc = { x: p6.x + 0.3 * scale, y: p6.y + 0.24 * scale };
        ctx.lineWidth = 0.6;
        ctx.strokeStyle = `rgba(${rgb},${((isDark ? 0.12 : 0.1) * sf).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(p6.x, p6.y);
        ctx.quadraticCurveTo(cArc.x, cArc.y, eArc.x, eArc.y);
        ctx.stroke();
        // 大角回响星：端点稍亮慢闪，与北斗同族取色（非铜橙）
        const arcTw = animate ? 0.7 + 0.3 * Math.sin((now * Math.PI * 2) / 4600 + 3.1) : 0.85;
        ctx.fillStyle = `rgba(${rgb},${(0.62 * arcTw * sf).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(eArc.x, eArc.y, 2.6, 0, Math.PI * 2);
        ctx.fill();
      }

      // 斗身→斗柄逐段连线
      ctx.lineWidth = 0.8;
      for (let i = 0; i < DIPPER_SEGS.length; i++) {
        const p = dipSegP(i, now, animate);
        if (p <= 0) continue;
        const a = dip[DIPPER_SEGS[i][0]];
        const b = dip[DIPPER_SEGS[i][1]];
        if (!a || !b) continue;
        ctx.strokeStyle = `rgba(${COPPER},${(0.8 * sf * Math.min(p * 1.5, 1)).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(a.x + (b.x - a.x) * p, a.y + (b.y - a.y) * p);
        ctx.stroke();
      }
      // 七星：默认主题前景色；仅 hover 时逐段连线并叠加铜橙（摇光端星略亮）
      for (let i = 0; i < dip.length; i++) {
        const p = dip[i];
        const dm = Math.hypot(p.x - mouse.x, p.y - mouse.y);
        const hov = dipHover ? Math.max(0, 1 - dm / 70) : 0;
        const endStar = i === 6;
        const baseR = endStar ? 4.1 : 3.3; // R4：2.8/3.5 → 3.3/4.1（随北斗整体放大）
        const baseA = endStar ? 1.0 : 0.88;
        const twinkle = animate ? 0.75 + 0.25 * Math.sin((now * Math.PI * 2) / 4000 + DIPPER_PHASES[i]) : 0.9;
        const r = baseR * (1 + dipLitF * 0.2 + hov * 0.35);

        ctx.fillStyle = `rgba(${rgb},${(baseA * twinkle * sf).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();

        const copA = Math.min((dipLitF * 0.9 + hov * 0.25) * sf, 1);
        if (copA > 0.01) {
          ctx.fillStyle = `rgba(${COPPER},${copA.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    function frame(now: number) {
      if (!running) return;
      draw(now, true);
      animationId = requestAnimationFrame(frame);
    }

    const cleanups: Array<() => void> = [];

    // 初始化：采样字母点阵 + 生成星野与星座（勿删——上次整体重写曾丢失此调用导致场景全黑）
    build();
    // 字体就绪后重建一次，保证按真实字形采样
    document.fonts?.ready.then(() => {
      if (phase === 'ambient') build();
    });

    // 主题切换：重取色；reduced-motion 静态帧立即重绘（动画帧由 rAF 自然用新色）
    cleanups.push(
      observeCanvasTheme(() => {
        theme = readCanvasTheme();
        if (REDUCED_MOTION) draw(0, false);
      }),
    );

    if (REDUCED_MOTION) {
      // 静态成形一帧：标题成形；北斗默认前景色不点亮（铜橙仅 hover 才有）
      assignTargets();
      stars.forEach((s) => {
        if (s.letter) {
          s.x = s.tx;
          s.y = s.ty;
        }
      });
      phase = 'formed';
      dipMode = 'idle';
      draw(0, false);
    } else {
      // 离屏暂停 rAF（提示词§九）
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

      // 标题成形/飞散：对标题粒子目标区（probe，与采样点阵同位）单独判定——
      // 目标区进入视口 55% 成形、<25% 飞散（与 Knowledge/Resources 同一锚点纪律，
      // 使上一幕标题飞散与本幕点名成形在滚动区间上咬合，消除幕间无字空窗）
      const titleProbe = titleProbeRef.current;
      if (titleProbe) {
        const phaseObserver = new IntersectionObserver(
          (entries) => {
            const entry = entries[0];
            const now = performance.now();
            if (entry.intersectionRatio >= 0.55) startForming(now);
            else if (entry.intersectionRatio < 0.25) startDispersing(now);
          },
          { threshold: [0, 0.25, 0.55] },
        );
        phaseObserver.observe(titleProbe);
        cleanups.push(() => phaseObserver.disconnect());

        // 兜底：挂载时标题目标区若已在视口内（深链/刷新直达），立即成形
        const r = titleProbe.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) startForming(performance.now());
      }

      // 场景入场：星野淡入淡出改时间驱动（与滚动速度解耦）——
      // 顶部进入视口即起 ~1.4s easeOutCubic 渐亮（配合上一幕过渡去硬边），
      // 完全离开视口后 ~0.9s 时间驱动渐隐；IO threshold 0 即触发。
      let fadeTween: gsap.core.Tween | null = null;
      const fadeTo = (target: number, dur: number) => {
        fadeTween?.kill();
        fadeTween = gsap.to(fadeObj, {
          v: target,
          duration: dur,
          ease: 'power3.out', // easeOutCubic
          overwrite: true,
        });
      };
      const fadeObserver = new IntersectionObserver(
        (entries) => {
          const vis = entries[0].isIntersecting;
          fadeTo(vis ? 1 : 0, vis ? 1.4 : 0.9);
        },
        { threshold: 0 },
      );
      fadeObserver.observe(wrap);
      cleanups.push(() => {
        fadeObserver.disconnect();
        fadeTween?.kill();
      });
    }

    function onResize() {
      build();
      if (REDUCED_MOTION) {
        stars.forEach((s) => {
          if (s.letter) {
            s.x = s.tx;
            s.y = s.ty;
          }
        });
        draw(0, false);
      }
    }
    window.addEventListener('resize', onResize);

    // hover 北斗包围盒：浮现入口文字 + 逐段点亮铜橙；离开逐段熄灭。
    // 点亮/熄灭仅在 hover 状态变化时触发（不再随标题成形自动点亮）。
    function onDipHoverChange(hov: boolean) {
      dipHover = hov;
      setDipperHover(hov);
      if (REDUCED_MOTION) return; // 静态帧不做逐段动画
      if (hov && (dipMode === 'idle' || dipMode === 'extinguishing')) {
        dipMode = 'lighting';
        dipT0 = performance.now();
      } else if (!hov && (dipMode === 'lit' || dipMode === 'lighting')) {
        dipMode = 'extinguishing';
        dipT0 = performance.now();
      }
    }
    function onMouseMove(e: MouseEvent) {
      const rect = canvas?.getBoundingClientRect();
      if (!rect) return;
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      const hov =
        mouse.x > dipBBox.x0 && mouse.x < dipBBox.x1 && mouse.y > dipBBox.y0 && mouse.y < dipBBox.y1;
      if (hov !== dipHover) onDipHoverChange(hov);
    }
    function onMouseLeave() {
      mouse.x = -1000;
      mouse.y = -1000;
      if (dipHover) onDipHoverChange(false);
    }
    // 鼠标事件挂在父元素上，canvas 本身 pointer-events-none
    wrap.addEventListener('mousemove', onMouseMove);
    wrap.addEventListener('mouseleave', onMouseLeave);

    return () => {
      running = false;
      cancelAnimationFrame(animationId);
      cleanups.forEach((fn) => fn());
      window.removeEventListener('resize', onResize);
      wrap.removeEventListener('mousemove', onMouseMove);
      wrap.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  return (
    <section className="relative w-full">
      {/* canvas 场景（~78vh），背景透明 */}
      <div ref={wrapRef} className="relative w-full" style={{ height: '78vh', minHeight: 480 }}>
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          aria-hidden="true"
        />

        {/* 标题粒子目标区探针：与采样点阵同位（cx 50% / cy 36%，范围 72%×32%），
            phaseObserver 据此判定标题成形/飞散（与 Knowledge/Resources 同纪律） */}
        <div
          ref={titleProbeRef}
          aria-hidden="true"
          className="absolute pointer-events-none"
          style={{ left: '14%', top: '20%', width: '72%', height: '32%' }}
        />

        {/* 中文铭牌 + 描述：SCHOLARS 正下方同轴居中，组装完成后淡入 */}
        <div
          className={`absolute left-1/2 -translate-x-1/2 z-10 text-center pointer-events-none ${
            assembled ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ top: '55%', transition: 'opacity 0.5s cubic-bezier(0.455,0.03,0.515,0.955)' }}
        >
          <p className="label-plate mb-3 opacity-70">{title}</p>
          <p className="text-[13px] text-secondary-foreground/70 leading-relaxed max-w-[300px]">
            {desc}
          </p>
        </div>

        {/* 入口文字：北斗下方，hover 七星时浮现（react-router Link） */}
        <Link
          to={link}
          className={`absolute left-1/2 -translate-x-1/2 z-10 text-[13px] font-semibold tracking-[0.15em] uppercase text-primary ${
            dipperHover ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 pointer-events-none'
          }`}
          style={{
            top: '84%',
            transition:
              'opacity 0.5s cubic-bezier(0.455,0.03,0.515,0.955), transform 0.5s cubic-bezier(0.455,0.03,0.515,0.955)',
          }}
        >
          {linkText}
        </Link>
      </div>
    </section>
  );
}
