/**
 * shipLineArt — ResourcesScene 卫星 / 飞船参数化 3D 线稿（无 WebGL）.
 *
 * 与 scopeLineArt / telescopeLineArt3D 同一思路：少量 3D 特征点建模
 * （y-up），经「自转/姿态旋转 → 弱透视投影 s = F/(F+z)」画在 2D canvas。
 * 卫星：Box 本体 + 双太阳能板（网格）+ 天线杆，随时间缓慢自转（偏航）
 * 更生动；飞船：圆柱舱 + Lathe 抛物碟 + RTG 棒，机头方向性由艏锥保持
 * （投影后艏向仍严格等于 heading）。
 *
 * 描边纪律不变：仅描边，轮廓 1.5/0.9、结构 1.0/0.5、纹理 0.5/0.25，
 * lineJoin/lineCap round，主题色取色；铜橙仅卫星被电波扫到的回闪瞬间。
 */

type V3 = { x: number; y: number; z: number };
type Pt = { x: number; y: number };

const cross = (a: V3, b: V3): V3 => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});
const norm = (a: V3): V3 => {
  const l = Math.hypot(a.x, a.y, a.z) || 1;
  return { x: a.x / l, y: a.y / l, z: a.z / l };
};

export type SatelliteLineArtOpts = {
  x: number;
  y: number;
  rot: number; // 自转偏航角（弧度，随时间缓慢变化）
  main: string; // 主题主色（描边）
  copper: string; // 铜橙 rgb 三元组（仅回闪瞬间）
  flash: number; // 回闪强度 0..1：>0 时本体描边转铜橙
  alpha?: number; // 整体透明度系数（默认 1）
};

/** 卫星：Box 本体(12×8×8) + 双侧网格太阳能板(18×7) + 顶部天线杆，总宽约 50px */
export function drawSatelliteLineArt(
  ctx: CanvasRenderingContext2D,
  o: SatelliteLineArtOpts,
): void {
  const alpha = o.alpha ?? 1;
  if (alpha <= 0) return;
  const bodyCol = o.flash > 0 ? `rgba(${o.copper},1)` : o.main;

  // 姿态：偏航自转 rot → 固定俯倾 -0.48（让板面/本体呈现 3D 透视）
  const tilt = -0.48;
  const cy = Math.cos(o.rot);
  const sy = Math.sin(o.rot);
  const ct = Math.cos(tilt);
  const st = Math.sin(tilt);
  const F = 240;
  const P = (p: V3): Pt => {
    const x1 = p.x * cy + p.z * sy; // RotY(rot)
    const z1 = -p.x * sy + p.z * cy;
    const y2 = p.y * ct - z1 * st; // RotX(tilt)
    const z2 = p.y * st + z1 * ct;
    const s = F / (F + z2);
    return { x: o.x + x1 * s, y: o.y - y2 * s };
  };

  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const stroke = (lw: number, a: number) => {
    ctx.globalAlpha = a * alpha;
    ctx.lineWidth = lw;
    ctx.stroke();
    ctx.globalAlpha = 1;
  };
  const seg = (a: V3, b: V3) => {
    const A = P(a);
    const B = P(b);
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
  };

  // 太阳能板（结构 1.0/0.5）：左右对称平板（xz 面）+ 本体连接短杆
  ctx.strokeStyle = o.main;
  ctx.beginPath();
  for (const sgn of [-1, 1]) {
    const x0 = sgn * 7;
    const x1 = sgn * 25;
    seg({ x: x0, y: 0, z: -3.5 }, { x: x1, y: 0, z: -3.5 });
    seg({ x: x1, y: 0, z: -3.5 }, { x: x1, y: 0, z: 3.5 });
    seg({ x: x1, y: 0, z: 3.5 }, { x: x0, y: 0, z: 3.5 });
    seg({ x: x0, y: 0, z: 3.5 }, { x: x0, y: 0, z: -3.5 });
    seg({ x: sgn * 6, y: 0, z: 0 }, { x: x0, y: 0, z: 0 }); // 连接短杆
  }
  stroke(1, 0.5);

  // 板面网格（纹理 0.5/0.25）：每板 3 条横格线
  ctx.beginPath();
  for (const sgn of [-1, 1]) {
    for (let i = 1; i <= 3; i++) {
      const gx = sgn * (7 + i * 4.5);
      seg({ x: gx, y: 0, z: -3.5 }, { x: gx, y: 0, z: 3.5 });
    }
  }
  stroke(0.5, 0.25);

  // 本体 Box（轮廓 1.5/0.9）：回闪瞬间转铜橙
  const hb: V3 = { x: 6, y: 4, z: 4 };
  const cn: V3[] = [];
  for (const sx of [-1, 1]) for (const yy of [-1, 1]) for (const sz of [-1, 1])
    cn.push({ x: sx * hb.x, y: yy * hb.y, z: sz * hb.z });
  const E = [
    [0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7],
    [0, 4], [1, 5], [2, 6], [3, 7],
  ];
  ctx.strokeStyle = bodyCol;
  ctx.beginPath();
  for (const [a, b] of E) seg(cn[a], cn[b]);
  stroke(1.5, 0.9);

  // 天线杆（结构 1.0/0.5）：顶杆 + 端点小圆
  ctx.strokeStyle = o.main;
  ctx.beginPath();
  seg({ x: 0, y: 4, z: 0 }, { x: 0, y: 9, z: 0 });
  stroke(1, 0.5);
  const tip = P({ x: 0, y: 9.8, z: 0 });
  ctx.beginPath();
  ctx.arc(tip.x, tip.y, 1.2, 0, Math.PI * 2);
  stroke(1, 0.5);

  ctx.restore();
}

export type ShipLineArtOpts = {
  x: number;
  y: number;
  heading: number; // 机头朝向（canvas 弧度，0 = +x；巡航朝左传 π）
  roll?: number; // 绕机体纵轴滚转（弧度，随时间轻微变化更生动）
  main: string; // 主题主色（描边）
  alpha?: number; // 整体透明度系数（默认 1）
};

/**
 * 飞船：圆柱舱 + 艏锥 + Lathe 抛物碟 + RTG 棒，全长约 38px。
 * 姿态链：RotX(roll 滚转) → RotY(固定 0.5 偏航，让圆环投影成椭圆)
 * → RotZ(−heading)；投影后艏向仍严格等于 heading，转向来波方向时朝向变化直接可见。
 */
export function drawShipLineArt(ctx: CanvasRenderingContext2D, o: ShipLineArtOpts): void {
  const alpha = o.alpha ?? 1;
  if (alpha <= 0) return;

  const roll = o.roll ?? 0;
  const YAW = 0.5;
  const cr = Math.cos(roll);
  const sr = Math.sin(roll);
  const cyw = Math.cos(YAW);
  const syw = Math.sin(YAW);
  const ch = Math.cos(o.heading);
  const sh = Math.sin(o.heading);
  const F = 260;
  const P = (p: V3): Pt => {
    const y1 = p.y * cr - p.z * sr; // RotX(roll)
    const z1 = p.y * sr + p.z * cr;
    const x2 = p.x * cyw + z1 * syw; // RotY(YAW)
    const z2 = -p.x * syw + z1 * cyw;
    const x3 = x2 * ch + y1 * sh; // RotZ（y-up 系 −heading ≡ canvas rotate(heading)）
    const y3 = -x2 * sh + y1 * ch;
    const s = F / (F + z2);
    return { x: o.x + x3 * s, y: o.y - y3 * s };
  };

  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = o.main;

  const stroke = (lw: number, a: number) => {
    ctx.globalAlpha = a * alpha;
    ctx.lineWidth = lw;
    ctx.stroke();
    ctx.globalAlpha = 1;
  };
  const seg = (a: V3, b: V3) => {
    const A = P(a);
    const B = P(b);
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
  };
  /** 法向沿机体纵轴(x)的圆环采样进当前路径 */
  const ringX = (x0: number, r: number, n = 20) => {
    for (let i = 0; i <= n; i++) {
      const phi = (i / n) * Math.PI * 2;
      const q = P({ x: x0, y: r * Math.cos(phi), z: r * Math.sin(phi) });
      if (i === 0) ctx.moveTo(q.x, q.y);
      else ctx.lineTo(q.x, q.y);
    }
  };

  // ── 圆柱舱（x ∈ [-10, 8]，r = 4.5）──
  ctx.beginPath(); // 前环（轮廓，与艏锥共底）
  ringX(8, 4.5, 24);
  stroke(1.5, 0.9);
  ctx.beginPath(); // 尾环（结构）
  ringX(-10, 4.5);
  stroke(1, 0.5);
  ctx.beginPath(); // 中环（纹理）
  ringX(-1, 4.5);
  stroke(0.5, 0.25);
  ctx.beginPath(); // 四条母线（结构）
  for (const phiDeg of [45, 135, 225, 315]) {
    const phi = (phiDeg * Math.PI) / 180;
    seg(
      { x: -10, y: 4.5 * Math.cos(phi), z: 4.5 * Math.sin(phi) },
      { x: 8, y: 4.5 * Math.cos(phi), z: 4.5 * Math.sin(phi) },
    );
  }
  stroke(1, 0.5);

  // ── 艏锥（机头方向性：顶点 (16,0,0)）──
  ctx.beginPath();
  for (const phiDeg of [45, 135, 225, 315]) {
    const phi = (phiDeg * Math.PI) / 180;
    seg({ x: 8, y: 4.5 * Math.cos(phi), z: 4.5 * Math.sin(phi) }, { x: 16, y: 0, z: 0 });
  }
  stroke(1.5, 0.9);
  ctx.beginPath(); // 锥面中环（纹理）
  ringX(12, 2.25, 16);
  stroke(0.5, 0.25);

  // ── Lathe 抛物碟：舱顶朝前上，碟轴 d̂ = (0.72, 0.69, 0) ──
  const d = norm({ x: 0.72, y: 0.69, z: 0 });
  const du = norm(cross(d, { x: 0, y: 0, z: 1 }));
  const dv = norm(cross(d, du));
  const DC: V3 = { x: -1, y: 8.2, z: 0 }; // 碟缘中心
  const DR = 5; // 碟缘半径
  const DD = 1.5; // 碟深
  const dishPt = (rho: number, phi: number): V3 => {
    const drop = DD * (rho / DR) ** 2;
    return {
      x: DC.x + rho * (du.x * Math.cos(phi) + dv.x * Math.sin(phi)) - d.x * drop,
      y: DC.y + rho * (du.y * Math.cos(phi) + dv.y * Math.sin(phi)) - d.y * drop,
      z: DC.z + rho * (du.z * Math.cos(phi) + dv.z * Math.sin(phi)) - d.z * drop,
    };
  };
  // 碟背支柱（结构）：舱顶 → 碟底
  ctx.beginPath();
  seg({ x: -1, y: 4.5, z: 0 }, { x: DC.x - d.x * DD, y: DC.y - d.y * DD, z: DC.z - d.z * DD });
  stroke(1, 0.5);
  ctx.beginPath(); // 碟缘（结构）
  for (let i = 0; i <= 20; i++) {
    const q = P(dishPt(DR, (i / 20) * Math.PI * 2));
    if (i === 0) ctx.moveTo(q.x, q.y);
    else ctx.lineTo(q.x, q.y);
  }
  stroke(1, 0.5);
  ctx.beginPath(); // 内环 + 4 条经线（纹理）
  for (let i = 0; i <= 16; i++) {
    const q = P(dishPt(DR * 0.55, (i / 16) * Math.PI * 2));
    if (i === 0) ctx.moveTo(q.x, q.y);
    else ctx.lineTo(q.x, q.y);
  }
  for (const phiDeg of [0, 90, 180, 270]) {
    const phi = (phiDeg * Math.PI) / 180;
    for (let s = 0; s <= 4; s++) {
      const q = P(dishPt(DR * (0.1 + (0.9 * s) / 4), phi));
      if (s === 0) ctx.moveTo(q.x, q.y);
      else ctx.lineTo(q.x, q.y);
    }
  }
  stroke(0.5, 0.25);

  // ── RTG：尾部斜伸棒 + 散热片 + 端头小柱 ──
  const r0: V3 = { x: -10, y: -2.5, z: 0 };
  const r1: V3 = { x: -19, y: -6.5, z: 0 };
  const rd = norm({ x: r1.x - r0.x, y: r1.y - r0.y, z: 0 });
  const rp = norm(cross(rd, { x: 0, y: 0, z: 1 })); // 屏内垂直于棒
  ctx.beginPath(); // 棒（结构）
  seg(r0, r1);
  stroke(1, 0.5);
  ctx.beginPath(); // 散热片 ×2（纹理）
  for (const t of [0.5, 0.75]) {
    const c: V3 = { x: r0.x + (r1.x - r0.x) * t, y: r0.y + (r1.y - r0.y) * t, z: 0 };
    seg(
      { x: c.x - rp.x * 2.2, y: c.y - rp.y * 2.2, z: c.z - rp.z * 2.2 },
      { x: c.x + rp.x * 2.2, y: c.y + rp.y * 2.2, z: c.z + rp.z * 2.2 },
    );
  }
  stroke(0.5, 0.25);
  ctx.beginPath(); // 端头小环（结构）
  for (let i = 0; i <= 12; i++) {
    const phi = (i / 12) * Math.PI * 2;
    const q = P({
      x: r1.x + rp.x * Math.cos(phi) * 1.6,
      y: r1.y + rp.y * Math.cos(phi) * 1.6,
      z: Math.sin(phi) * 1.6,
    });
    if (i === 0) ctx.moveTo(q.x, q.y);
    else ctx.lineTo(q.x, q.y);
  }
  stroke(1, 0.5);

  ctx.restore();
}
