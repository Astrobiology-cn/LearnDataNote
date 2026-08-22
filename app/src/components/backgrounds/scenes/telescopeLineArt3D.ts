/**
 * telescopeLineArt3D — ResourcesScene 射电望远镜参数化 3D 线框（无 WebGL）.
 *
 * 与 scopeLineArt 同一思路：局部 3D 特征点/圆环建模（y-up，原点 = 俯仰轴，
 * 尺寸单位为 TS 倍数），经「俯仰轴旋转 → 相机微俯角(12°) → 弱透视投影
 * s = F/(F+z)」画在 2D canvas。俯仰轴旋转方向与旧 2D ctx.rotate 逐点等价，
 * 故既有 ±4° 摆动、1° 回弹、点击命中、电波发射点逻辑全部沿用。
 *
 * 结构：塔架三段圆柱（静态层）+ 基座/地面线（屏幕空间）+ 旋转层
 * （Lathe 式抛物碟面经纬线框 + 三支杆 + 馈源舱 + 配重）。
 * 装配动画由 deploy ∈ [0,1] 驱动：碟面半径从收拢到张开，馈源/支杆后段淡入；
 * 离视口重置为 0（复位，非倒放）。
 *
 * 描边纪律与全站一致：轮廓 1.5/0.9、结构 1.0/0.5、纹理 0.5/0.25，
 * lineJoin/lineCap round；铜橙仅馈源舱，碟面/塔架用主题前景色。
 */

type V3 = { x: number; y: number; z: number };
type Pt = { x: number; y: number };

export type Telescope3DOpts = {
  pivotX: number; // 俯仰轴屏幕 x
  pivotY: number; // 俯仰轴屏幕 y
  groundY: number; // 地面线屏幕 y
  TS: number; // 场景缩放（1.0~1.7）
  pitch: number; // 摆动−回弹合成角（弧度，绕俯仰轴，与旧 2D 旋转同向）
  deploy: number; // 装配因子 0..1：碟面从收拢到张开
  main: string; // 主题主色（描边）
  bg: string; // 主题背景色（碟面内面/基座填充遮穿帮）
  copper: string; // 铜橙 rgb 三元组（仅馈源舱）
};

const DEG = Math.PI / 180;
// 相机微俯角：水平圆环投影成椭圆，产生 3D 感
const COS_E = Math.cos(12 * DEG);
const SIN_E = Math.sin(12 * DEG);

/* ── 碟面局部几何（y-up，原点 = 俯仰轴，单位 = TS 倍数）──────────── */

const RIM_R = 58; // 碟缘半径
const DISH_C: V3 = { x: 30, y: 34, z: 0 }; // 碟面中心
const DISH_DEPTH = 16; // 抛物面深度
const FEED_DIST = 50; // 馈源沿轴距碟面中心距离

// 碟面轴线：屏内分量方位 25°（开口朝右上），z 分量 0.33 → 碟缘投影长短轴比 ~0.33
const AXIS: V3 = (() => {
  const k = Math.sqrt(1 - 0.33 * 0.33);
  return { x: Math.sin(25 * DEG) * k, y: Math.cos(25 * DEG) * k, z: 0.33 };
})();

const cross = (a: V3, b: V3): V3 => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});
const norm = (a: V3): V3 => {
  const l = Math.hypot(a.x, a.y, a.z) || 1;
  return { x: a.x / l, y: a.y / l, z: a.z / l };
};

// 碟缘平面正交基
const U = norm(cross(AXIS, { x: 0, y: 0, z: 1 }));
const V = norm(cross(AXIS, U));

/** 抛物面上的点：ρ 为距轴径向距离（TS 倍数），φ 为盘周角 */
function dishPoint(rho: number, phi: number): V3 {
  const dx = U.x * Math.cos(phi) + V.x * Math.sin(phi);
  const dy = U.y * Math.cos(phi) + V.y * Math.sin(phi);
  const dz = U.z * Math.cos(phi) + V.z * Math.sin(phi);
  const drop = DISH_DEPTH * (rho / RIM_R) ** 2;
  return {
    x: DISH_C.x + rho * dx - AXIS.x * drop,
    y: DISH_C.y + rho * dy - AXIS.y * drop,
    z: DISH_C.z + rho * dz - AXIS.z * drop,
  };
}

/** 馈源舱局部坐标：装配时沿轴从毂旁 (8) 推到焦位 (FEED_DIST) */
function feedLocal(deploy: number): V3 {
  const d = 8 + (FEED_DIST - 8) * deploy;
  return {
    x: DISH_C.x + AXIS.x * d,
    y: DISH_C.y + AXIS.y * d,
    z: DISH_C.z + AXIS.z * d,
  };
}

/* ── 投影 ─────────────────────────────────────────────────── */

/**
 * 局部(y-up, TS 倍数) → 屏幕。rotate=true 的点随碟面组绕俯仰轴转 −pitch
 * （y-up 系内转 −pitch ≡ 旧 2D canvas ctx.rotate(pitch)，摆动/回弹方向不变）。
 */
function makeXf(pivotX: number, pivotY: number, TS: number, pitch: number) {
  const F = 700 * TS; // 弱透视焦距：近大远小 ~±8%
  const c = Math.cos(pitch);
  const s = Math.sin(pitch);
  return (p: V3, rotate: boolean): Pt => {
    let x = p.x * TS;
    let y = p.y * TS;
    const z = p.z * TS;
    if (rotate) {
      const x2 = x * c + y * s;
      const y2 = -x * s + y * c;
      x = x2;
      y = y2;
    }
    const yc = y * COS_E - z * SIN_E;
    const zc = y * SIN_E + z * COS_E;
    const sc = F / (F + zc);
    return { x: pivotX + x * sc, y: pivotY - yc * sc };
  };
}

/** 装配完成位形下的馈源舱屏幕坐标（电波同心圆环心 / 粒子聚散锚点） */
export function telescopeFeedPoint(
  pivotX: number,
  pivotY: number,
  TS: number,
  pitch: number,
): Pt {
  return makeXf(pivotX, pivotY, TS, pitch)(feedLocal(1), true);
}

/* ── 绘制 ─────────────────────────────────────────────────── */

export function drawTelescope3D(ctx: CanvasRenderingContext2D, o: Telescope3DOpts): void {
  const { main, bg, copper, TS } = o;
  const deploy = Math.max(0, Math.min(1, o.deploy));
  const xf = makeXf(o.pivotX, o.pivotY, TS, o.pitch);
  // 馈源/支杆在碟面张开过半后淡入（点亮）
  const feedAlpha = Math.max(0, Math.min(1, (deploy - 0.45) / 0.55));

  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const stroke = (lw: number, a: number) => {
    ctx.globalAlpha = a;
    ctx.lineWidth = lw;
    ctx.stroke();
    ctx.globalAlpha = 1;
  };
  const seg = (a: V3, b: V3, rot: boolean) => {
    const A = xf(a, rot);
    const B = xf(b, rot);
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
  };
  /** 采样折线进当前路径（可选闭合） */
  const poly = (pts: V3[], rot: boolean, close = false) => {
    pts.forEach((p, i) => {
      const q = xf(p, rot);
      if (i === 0) ctx.moveTo(q.x, q.y);
      else ctx.lineTo(q.x, q.y);
    });
    if (close) ctx.closePath();
  };
  /** 以 n 为法向的圆环采样（ cyl/rim 通用，局部坐标） */
  const ringPts = (c: V3, r: number, u: V3, v: V3, n = 28): V3[] => {
    const pts: V3[] = [];
    for (let i = 0; i <= n; i++) {
      const phi = (i / n) * Math.PI * 2;
      pts.push({
        x: c.x + r * (u.x * Math.cos(phi) + v.x * Math.sin(phi)),
        y: c.y + r * (u.y * Math.cos(phi) + v.y * Math.sin(phi)),
        z: c.z + r * (u.z * Math.cos(phi) + v.z * Math.sin(phi)),
      });
    }
    return pts;
  };

  // ── 远景：地面线（屏幕空间，同旧版）──
  ctx.strokeStyle = main;
  ctx.beginPath();
  ctx.moveTo(o.pivotX - 100 * TS, o.groundY);
  ctx.lineTo(o.pivotX + 190 * TS, o.groundY);
  stroke(1, 0.5);

  // ── 塔架三段圆柱（静态层，不随俯仰旋转）──
  const RIGHT: V3 = { x: 1, y: 0, z: 0 };
  const FWD: V3 = { x: 0, y: 0, z: 1 };
  const cyls = [
    { y0: -108, y1: -72, r: 16, lw: 1.5, la: 0.9 }, // 下段（轮廓）
    { y0: -72, y1: -36, r: 11, lw: 1, la: 0.5 }, // 中段（结构）
    { y0: -36, y1: -3, r: 7, lw: 1, la: 0.5 }, // 上段（结构）
  ];
  for (const cy of cyls) {
    // 侧母线（轮廓/结构）
    ctx.beginPath();
    seg({ x: -cy.r, y: cy.y0, z: 0 }, { x: -cy.r, y: cy.y1, z: 0 }, false);
    seg({ x: cy.r, y: cy.y0, z: 0 }, { x: cy.r, y: cy.y1, z: 0 }, false);
    stroke(cy.lw, cy.la);
    // 顶环（结构）
    ctx.beginPath();
    poly(ringPts({ x: 0, y: cy.y1, z: 0 }, cy.r, RIGHT, FWD, 24), false);
    stroke(1, 0.5);
    // 底环（纹理）
    ctx.beginPath();
    poly(ringPts({ x: 0, y: cy.y0, z: 0 }, cy.r, RIGHT, FWD, 24), false);
    stroke(0.5, 0.25);
  }

  // 基座：背景色填实遮住塔架底环穿帮线，再描轮廓（屏幕空间）
  const padW = 30 * TS;
  const padH = 5 * TS;
  const baseX = o.pivotX;
  ctx.fillStyle = bg;
  ctx.globalAlpha = 1;
  ctx.fillRect(baseX - padW, o.groundY - padH, padW * 2, padH);
  ctx.strokeStyle = main;
  ctx.beginPath();
  ctx.rect(baseX - padW, o.groundY - padH, padW * 2, padH);
  stroke(1, 0.5);

  // ── 旋转层：配重（随俯仰轴摆动）──
  if (deploy > 0.01) {
    const BC: V3 = { x: -26, y: -18, z: 0 }; // 配重盒中心
    const hb: V3 = { x: 6, y: 4.5, z: 4 }; // 半尺寸
    const top: V3 = { x: BC.x, y: BC.y + hb.y, z: BC.z };
    const dl = Math.hypot(top.x, top.y, top.z) || 1;
    ctx.strokeStyle = main;
    ctx.beginPath(); // 配重臂：起于轴承圆边缘、止于盒顶
    seg({ x: (top.x / dl) * 6, y: (top.y / dl) * 6, z: (top.z / dl) * 6 }, top, true);
    stroke(1, 0.5 * deploy);
    // 配重盒（3D 线框）
    const cn: V3[] = [];
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1])
      cn.push({ x: BC.x + sx * hb.x, y: BC.y + sy * hb.y, z: BC.z + sz * hb.z });
    const E = [
      [0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7],
      [0, 4], [1, 5], [2, 6], [3, 7],
    ];
    ctx.beginPath();
    for (const [a, b] of E) seg(cn[a], cn[b], true);
    stroke(1, 0.5 * deploy);
  }

  // ── 旋转层：抛物碟面（Lathe 经纬线框，deploy 从收拢到张开）──
  if (deploy > 0.01) {
    const RD = RIM_R * deploy; // 当前张开的碟缘半径
    const rimPts: V3[] = [];
    for (let i = 0; i <= 40; i++) rimPts.push(dishPoint(RD, (i / 40) * Math.PI * 2));

    // 碟面内面：先以背景色填实碟缘多边形，挡住后方塔架穿帮线
    ctx.fillStyle = bg;
    ctx.globalAlpha = deploy;
    ctx.beginPath();
    poly(rimPts, true, true);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.strokeStyle = main;
    // 纬环 ×2（纹理）
    ctx.beginPath();
    poly(ringAt(0.68 * RD), true);
    poly(ringAt(0.4 * RD), true);
    stroke(0.5, 0.25);
    // 经线 ×8：沿抛物面从毂到缘（纹理）
    ctx.beginPath();
    for (let m = 0; m < 8; m++) {
      const phi = (m / 8) * Math.PI * 2;
      const pts: V3[] = [];
      for (let s = 0; s <= 6; s++) pts.push(dishPoint(RD * (0.06 + (0.94 * s) / 6), phi));
      poly(pts, true);
    }
    stroke(0.5, 0.25);
    // 碟缘（轮廓）
    ctx.beginPath();
    poly(rimPts, true);
    stroke(1.5, 0.9);

    // 馈源三支杆：碟缘 → 馈源舱（结构，随点亮淡入）
    if (feedAlpha > 0) {
      const feed = feedLocal(deploy);
      ctx.beginPath();
      for (const phiDeg of [-30, 110, 230]) {
        seg(dishPoint(RD, phiDeg * DEG), feed, true);
      }
      stroke(1, 0.5 * feedAlpha);

      // 馈源舱：铜橙 3D 小盒（轮廓，全站唯一铜橙）
      const hf: V3 = { x: 2.6, y: 3.6, z: 2.6 };
      const fc: V3[] = [];
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1])
        fc.push({ x: feed.x + sx * hf.x, y: feed.y + sy * hf.y, z: feed.z + sz * hf.z });
      const FE = [
        [0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7],
        [0, 4], [1, 5], [2, 6], [3, 7],
      ];
      ctx.strokeStyle = `rgba(${copper},1)`;
      ctx.beginPath();
      for (const [a, b] of FE) seg(fc[a], fc[b], true);
      stroke(1.5, 0.9 * feedAlpha);
    }
  }

  // 轴承座：背景色填充遮住接点，再描轮廓（屏幕空间，同旧版）
  ctx.fillStyle = bg;
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(o.pivotX, o.pivotY, 6 * TS, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = main;
  ctx.beginPath();
  ctx.arc(o.pivotX, o.pivotY, 6 * TS, 0, Math.PI * 2);
  stroke(1.5, 0.9);

  ctx.restore();

  /** 半径 ρ 的纬环采样（沿抛物面下沉） */
  function ringAt(rho: number): V3[] {
    const pts: V3[] = [];
    for (let i = 0; i <= 28; i++) pts.push(dishPoint(rho, (i / 28) * Math.PI * 2));
    return pts;
  }
}
