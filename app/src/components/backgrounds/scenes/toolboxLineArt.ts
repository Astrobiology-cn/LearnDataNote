/**
 * toolboxLineArt — KnowledgeScene 参数化 3D 线稿工具箱.
 *
 * 与 scopeLineArt 同一纪律：少量 3D 特征点/线段建模，弱透视投影
 * （s = F/(F+z)）画 1px 线稿；不用 WebGL。
 *
 * 模型（物体空间：x 屏右、y 屏上、z 朝观察者，箱底中心为原点）：
 * - 箱体：bw × bh × bd 线框盒（顶沿口线加粗，读得出"容器"）；
 * - 箱盖：同底面浅盒，绕**后下沿铰链轴**（y=bh、z=-bd/2、沿 x 轴）做真 3D
 *   旋转开合，openT 0→1 对应 0°→100° 向后倒翻；铰链两端画短轴销；
 * - 提手：盖顶双立柱 + 拱梁，随盖同转；锁扣：箱体前面扣片 + 盖沿扣环（随盖）；
 * - 箱内工具剪影：扳手 / 直尺 / 齿轮简化线稿，立放在箱内、高出箱口，
 *   随开箱略微提亮；
 * - 开箱时箱内透**白色径向辉光**（深模式 0.5 / 浅模式柔白 0.7，严禁铜橙），
 *   辉光先画、线稿压上。
 *
 * 整箱固定 yaw -17° + 前倾 10°（看到右侧面与箱口/盖顶），箱底最低角
 * 钉死在地面线上。描边纪律：轮廓 1.5/0.9、结构 1/0.5、纹理 0.5/0.25；
 * hover 高亮只做提亮加粗（前景色），不用铜橙。
 */

type V3 = { x: number; y: number; z: number };

export type ToolboxLineArtOpts = {
  px: number; // 箱底中心屏幕 x
  groundY: number; // 地面线屏幕 y（箱底最低角钉死在此）
  bs: number; // 箱体净高（px），全部尺寸基准
  openT: number; // 盖开合 0=合 1=开（100°，调用方负责缓动）
  hoverT: number; // hover 高亮 0-1（提亮加粗）
  main: string; // 主题主色（描边）
  alpha: number; // 整体透明度（随地面下沉淡出）
  isDark: boolean; // 白色辉光强度按主题取
};

const DEG = Math.PI / 180;
const LID_MAX_DEG = 100; // 全开：绕后下沿铰链向后倒翻 100°

export function drawToolboxLineArt(ctx: CanvasRenderingContext2D, o: ToolboxLineArtOpts): void {
  const { px, groundY, bs, openT, hoverT, main, alpha, isDark } = o;
  if (alpha <= 0 || bs <= 0) return;

  // ── 尺寸（物体空间，单位 bs）──
  const hw = 0.75; // 半宽（x）
  const bh = 1.0; // 箱体净高
  const hd = 0.45; // 半深（z），后沿 z=-hd、前沿 z=+hd
  const lh = 0.3; // 盖高
  const hingeY = bh;
  const hingeZ = -hd;

  // ── 整箱姿态：yaw 看到右侧面，前倾看到箱口/盖顶 ──
  const yaw = -17 * DEG;
  const pitch = 10 * DEG;
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);

  /** 物体空间 → 世界（yaw→pitch），暂不落地 */
  function pose(p: V3): V3 {
    const x1 = p.x * cy + p.z * sy;
    const z1 = -p.x * sy + p.z * cy;
    const y2 = p.y * cp - z1 * sp;
    const z2 = p.y * sp + z1 * cp;
    return { x: x1, y: y2, z: z2 };
  }

  // 箱底四角姿态后的最低点 → 落地偏移（最低角钉死地面线）
  let minBaseY = Infinity;
  for (const bx of [-hw, hw])
    for (const bz of [-hd, hd]) {
      const q = pose({ x: bx * bs, y: 0, z: bz * bs });
      if (q.y < minBaseY) minBaseY = q.y;
    }
  const drop = -minBaseY;

  // 弱透视投影：z 朝观察者为正
  const F = 6 * bs * 1.6;
  const proj = (p: V3): { x: number; y: number } => {
    const q = pose(p);
    const s = F / (F + q.z);
    return { x: px + q.x * s, y: groundY - (q.y + drop) * s };
  };

  // ── 盖开合：绕后下沿铰链轴（沿 x）真 3D 旋转 ──
  const th = openT * LID_MAX_DEG * DEG;
  const ct = Math.cos(th);
  const st = Math.sin(th);
  /** 盖系点：先绕铰链旋转（开后向前沿抬升、倒向箱后），再走整箱姿态投影 */
  function lidPt(p: V3): { x: number; y: number } {
    const ry = p.y - hingeY * bs;
    const rz = p.z - hingeZ * bs;
    return proj({
      x: p.x,
      y: hingeY * bs + ry * ct + rz * st,
      z: hingeZ * bs - ry * st + rz * ct,
    });
  }

  // hover 提亮加粗（前景色，不用铜橙）
  const boost = 1 + 0.55 * hoverT;
  const wBoost = 1 + 0.4 * hoverT;

  function stroke(lw: number, a: number) {
    ctx.globalAlpha = Math.min(1, a * boost) * alpha;
    ctx.lineWidth = lw * wBoost;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  function seg(A: { x: number; y: number }, B: { x: number; y: number }) {
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
  }
  function bodySeg(a: V3, b: V3) {
    seg(proj(a), proj(b));
  }
  function lidSeg(a: V3, b: V3) {
    seg(lidPt(a), lidPt(b));
  }
  /** 物体空间矩形框（y 高度上的水平四边形） */
  function rectPath(project: (p: V3) => { x: number; y: number }, y: number) {
    const cs: V3[] = [
      { x: -hw * bs, y, z: -hd * bs },
      { x: hw * bs, y, z: -hd * bs },
      { x: hw * bs, y, z: hd * bs },
      { x: -hw * bs, y, z: hd * bs },
    ];
    cs.forEach((c, i) => {
      const q = project(c);
      if (i === 0) ctx.moveTo(q.x, q.y);
      else ctx.lineTo(q.x, q.y);
    });
    ctx.closePath();
  }

  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = main;

  // ── 箱内白色径向辉光（开箱时，先画垫底，严禁铜橙）──
  if (openT > 0.01) {
    const gc = proj({ x: 0, y: bh * bs * 0.8, z: 0 });
    const gr = bs * 1.6;
    const gA = (isDark ? 0.5 : 0.7) * openT * alpha;
    const grad = ctx.createRadialGradient(gc.x, gc.y, 0, gc.x, gc.y, gr);
    grad.addColorStop(0, `rgba(255,255,255,${gA.toFixed(3)})`);
    grad.addColorStop(0.55, `rgba(255,255,255,${(gA * 0.35).toFixed(3)})`);
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(gc.x, gc.y, gr, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── 箱内工具剪影（扳手 / 直尺 / 齿轮，开箱略微提亮）──
  const toolA = 0.55 + 0.45 * openT;
  // 扳手：立柄 + 顶部开口爪（简化 C 形弧）
  {
    const wx = -0.38 * bs;
    const wz = 0.08 * bs;
    const y0 = 0.35 * bs;
    const y1 = 1.18 * bs;
    ctx.beginPath();
    bodySeg({ x: wx, y: y0, z: wz }, { x: wx, y: y1, z: wz });
    const jr = 0.1 * bs;
    for (let i = 0; i <= 10; i++) {
      const phi = (55 + i * 25) * DEG; // 55°→305°，缺口朝右上
      const p = proj({ x: wx + Math.cos(phi) * jr, y: y1 + Math.sin(phi) * jr, z: wz });
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    stroke(1, 0.9 * toolA);
  }
  // 直尺：微倾细长矩形 + 刻度
  {
    const rx = 0.06 * bs;
    const rz = -0.14 * bs;
    const tilt = -9 * DEG;
    const c = Math.cos(tilt);
    const s = Math.sin(tilt);
    const rw = 0.07 * bs;
    const y0 = 0.3 * bs;
    const y1 = 1.26 * bs;
    const corner = (lx: number, ly: number): V3 => ({
      x: rx + lx * c - ly * s,
      y: (y0 + y1) / 2 + lx * s + ly * c,
      z: rz,
    });
    ctx.beginPath();
    const cs = [corner(-rw, -(y1 - y0) / 2), corner(rw, -(y1 - y0) / 2), corner(rw, (y1 - y0) / 2), corner(-rw, (y1 - y0) / 2)];
    cs.forEach((p, i) => {
      const q = proj(p);
      if (i === 0) ctx.moveTo(q.x, q.y);
      else ctx.lineTo(q.x, q.y);
    });
    ctx.closePath();
    stroke(1, 0.9 * toolA);
    ctx.beginPath();
    for (let i = 1; i <= 3; i++) {
      const ty = -(y1 - y0) / 2 + ((y1 - y0) / 4) * i;
      bodySeg(corner(-rw, ty), corner(-rw * 0.2, ty));
    }
    stroke(0.5, 0.5 * toolA);
  }
  // 齿轮：x-y 面圆 + 8 齿 + 心圆
  {
    const gx = 0.4 * bs;
    const gz = 0.02 * bs;
    const gy = 0.86 * bs;
    const r = 0.17 * bs;
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) {
      const phi = (i / 24) * Math.PI * 2;
      const p = proj({ x: gx + Math.cos(phi) * r, y: gy + Math.sin(phi) * r, z: gz });
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    stroke(1, 0.9 * toolA);
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const phi = (i / 8) * Math.PI * 2 + 0.2;
      bodySeg(
        { x: gx + Math.cos(phi) * r, y: gy + Math.sin(phi) * r, z: gz },
        { x: gx + Math.cos(phi) * r * 1.32, y: gy + Math.sin(phi) * r * 1.32, z: gz },
      );
    }
    stroke(1, 0.5 * toolA);
    ctx.beginPath();
    for (let i = 0; i <= 16; i++) {
      const phi = (i / 16) * Math.PI * 2;
      const p = proj({ x: gx + Math.cos(phi) * r * 0.35, y: gy + Math.sin(phi) * r * 0.35, z: gz });
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    stroke(0.5, 0.5 * toolA);
  }

  // ── 箱体线框 ──
  ctx.beginPath(); // 顶沿口线（容器感）
  rectPath(proj, bh * bs);
  stroke(1.5, 0.9);
  ctx.beginPath(); // 四条立棱
  for (const ex of [-hw, hw])
    for (const ez of [-hd, hd])
      bodySeg({ x: ex * bs, y: 0, z: ez * bs }, { x: ex * bs, y: bh * bs, z: ez * bs });
  stroke(1.5, 0.9);
  ctx.beginPath(); // 底框（贴地，结构线弱化）
  rectPath(proj, 0);
  stroke(1, 0.5);

  // ── 锁扣：箱体前面扣片（不随盖）──
  {
    const z = hd * bs;
    const lw2 = 0.09 * bs;
    const y0 = 0.68 * bs;
    const y1 = 0.94 * bs;
    ctx.beginPath();
    bodySeg({ x: -lw2, y: y0, z }, { x: lw2, y: y0, z });
    bodySeg({ x: lw2, y: y0, z }, { x: lw2, y: y1, z });
    bodySeg({ x: lw2, y: y1, z }, { x: -lw2, y: y1, z });
    bodySeg({ x: -lw2, y: y1, z }, { x: -lw2, y: y0, z });
    stroke(1, 0.9);
  }

  // ── 铰链：后下沿轴两端短销 ──
  ctx.beginPath();
  for (const ex of [-hw, hw]) {
    bodySeg(
      { x: ex * bs, y: hingeY * bs - 0.05 * bs, z: hingeZ * bs },
      { x: ex * bs, y: hingeY * bs + 0.07 * bs, z: hingeZ * bs - 0.06 * bs },
    );
  }
  stroke(1.5, 0.9);

  // ── 箱盖（绕后下沿铰链旋转）+ 提手 + 盖沿扣环 ──
  const lidTop = (bh + lh) * bs;
  ctx.beginPath(); // 盖顶框
  rectPath(lidPt, lidTop);
  stroke(1.5, 0.9);
  ctx.beginPath(); // 盖四立棱
  for (const ex of [-hw, hw])
    for (const ez of [-hd, hd])
      lidSeg({ x: ex * bs, y: bh * bs, z: ez * bs }, { x: ex * bs, y: lidTop, z: ez * bs });
  stroke(1.5, 0.9);
  if (openT > 0.01) {
    ctx.beginPath(); // 盖底框（合盖时与箱口重合，省略）
    rectPath(lidPt, bh * bs);
    stroke(1, 0.5);
  }
  // 提手：盖顶双立柱 + 三段拱梁（随盖同转）
  {
    const hx = 0.3 * bs;
    const hh2 = 0.22 * bs;
    const zt = 0;
    ctx.beginPath();
    lidSeg({ x: -hx, y: lidTop, z: zt }, { x: -hx, y: lidTop + hh2 * 0.7, z: zt });
    lidSeg({ x: hx, y: lidTop, z: zt }, { x: hx, y: lidTop + hh2 * 0.7, z: zt });
    lidSeg({ x: -hx, y: lidTop + hh2 * 0.7, z: zt }, { x: -hx * 0.55, y: lidTop + hh2, z: zt });
    lidSeg({ x: -hx * 0.55, y: lidTop + hh2, z: zt }, { x: hx * 0.55, y: lidTop + hh2, z: zt });
    lidSeg({ x: hx * 0.55, y: lidTop + hh2, z: zt }, { x: hx, y: lidTop + hh2 * 0.7, z: zt });
    stroke(1.5, 0.9);
  }
  // 盖沿扣环：盖前下沿小方环（随盖，合盖时正对扣片）
  {
    const z = hd * bs;
    const rw2 = 0.06 * bs;
    const y0 = bh * bs - 0.02 * bs;
    const y1 = bh * bs + 0.12 * bs;
    ctx.beginPath();
    lidSeg({ x: -rw2, y: y0, z }, { x: rw2, y: y0, z });
    lidSeg({ x: rw2, y: y0, z }, { x: rw2, y: y1, z });
    lidSeg({ x: rw2, y: y1, z }, { x: -rw2, y: y1, z });
    lidSeg({ x: -rw2, y: y1, z }, { x: -rw2, y: y0, z });
    stroke(1, 0.9);
  }

  ctx.restore();
}
