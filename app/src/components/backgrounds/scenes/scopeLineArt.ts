/**
 * scopeLineArt — KnowledgeScene 参数化线稿望远镜.
 *
 * 静态层：三脚架（脚底钉死在地面线，不随指向旋转）+ 架顶枢轴球。
 * 旋转层：镜筒组件（主筒、目镜、寻星镜）以少量 3D 特征点/圆环建模，
 * 绕枢轴做真方位角 + 俯仰旋转，经弱透视投影（正交 + 深度缩放 s = F/(F+z)）
 * 画 1px 线稿；镜筒转向观察者时筒口投影为正圆，侧视时自然透视缩短。
 * 描边纪律与 ResourcesScene 射电望远镜一致：轮廓 1.5/0.9、结构 1/0.5、
 * 纹理 0.5/0.25，主题色取色，铜橙仅寻星镜端点一处点缀。
 */

type V3 = { x: number; y: number; z: number };

export type ScopeLineArtOpts = {
  px: number; // 枢轴屏幕 x
  py: number; // 枢轴屏幕 y
  groundY: number; // 地面线屏幕 y（脚底钉死在此）
  mh: number; // 支架高（枢轴→脚底，px），兼作全部尺寸基准
  azDeg: number; // 方位角（度）：180 = 屏幕正左；<180 转向观察者，>180 转向纵深
  altDeg: number; // 仰角（度）
  main: string; // 主题主色（描边）
  copper: string; // 铜橙 rgb 三元组（仅寻星镜端点点缀）
  alpha: number; // 整体透明度（随地面下沉淡出）
};

const DEG = Math.PI / 180;

export function drawScopeLineArt(ctx: CanvasRenderingContext2D, o: ScopeLineArtOpts): void {
  const { px, py, groundY, mh, main, copper, alpha } = o;
  if (alpha <= 0) return;

  const az = o.azDeg * DEG;
  const alt = o.altDeg * DEG;

  const add = (a: V3, b: V3): V3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
  const sub = (a: V3, b: V3): V3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
  const mul = (a: V3, k: number): V3 => ({ x: a.x * k, y: a.y * k, z: a.z * k });
  const cross = (a: V3, b: V3): V3 => ({
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  });
  const norm = (a: V3): V3 => {
    const l = Math.hypot(a.x, a.y, a.z);
    return l > 1e-6 ? mul(a, 1 / l) : { x: 0, y: 0, z: 1 };
  };

  // 镜筒轴向单位向量（世界系：x 屏右、y 屏上、z 朝观察者；az 180° = 屏幕正左）
  const d: V3 = {
    x: Math.cos(alt) * Math.cos(az),
    y: Math.sin(alt),
    z: Math.cos(alt) * Math.sin(az),
  };
  // 筒身截面正交基：u 水平向、v 筒背侧（寻星镜/目镜沿 v 偏移）
  const u = norm(cross(d, { x: 0, y: 1, z: 0 }));
  const v = norm(cross(u, d));

  // 弱透视投影：z 朝观察者为正，近处 s > 1
  const F = 6 * mh;
  const proj = (p: V3): { x: number; y: number } => {
    const s = F / (F + p.z);
    return { x: px + p.x * s, y: py - p.y * s };
  };

  function stroke(lw: number, a: number) {
    ctx.globalAlpha = a * alpha;
    ctx.lineWidth = lw;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  function seg(a: V3, b: V3) {
    const A = proj(a);
    const B = proj(b);
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
  }
  /** 以 d 为法向的圆环采样进当前路径（筒口/环纹，转向观察者时投影为正圆） */
  function ringPath(c: V3, r: number, n = 28) {
    for (let i = 0; i <= n; i++) {
      const phi = (i / n) * Math.PI * 2;
      const p = add(c, add(mul(u, Math.cos(phi) * r), mul(v, Math.sin(phi) * r)));
      const q = proj(p);
      if (i === 0) ctx.moveTo(q.x, q.y);
      else ctx.lineTo(q.x, q.y);
    }
  }
  const lerpV = (a: V3, b: V3, t: number): V3 => add(a, mul(sub(b, a), t));

  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = main;

  // ── 静态层：三脚架（脚底钉死在地面线，不随指向旋转）──
  const rb = 0.07 * mh; // 枢轴球半径
  const feet = [
    { fx: px - 0.58 * mh, lw: 1.5, a: 0.9 },
    { fx: px + 0.58 * mh, lw: 1.5, a: 0.9 },
    { fx: px + 0.1 * mh, lw: 1, a: 0.5 }, // 中置后腿
  ];
  for (const f of feet) {
    const dx = f.fx - px;
    const dy = groundY - py;
    const l = Math.hypot(dx, dy) || 1;
    ctx.beginPath();
    ctx.moveTo(px + (dx / l) * rb, py + (dy / l) * rb); // 起于枢轴球边缘
    ctx.lineTo(f.fx, groundY);
    stroke(f.lw, f.a);
    ctx.beginPath(); // 脚垫：横钉在地面线上
    ctx.moveTo(f.fx - 0.05 * mh, groundY);
    ctx.lineTo(f.fx + 0.05 * mh, groundY);
    stroke(f.lw, f.a);
  }

  // ── 旋转层：镜筒组件绕枢轴做真方位/俯仰 ──
  const rB = 0.075 * mh; // 主筒后缘半径
  const rF = 0.09 * mh; // 主筒前缘（物镜框）半径
  const cb = mul(d, -0.5 * mh); // 筒尾
  const cf = mul(d, 0.72 * mh); // 筒口
  const rAt = (t: number) => rB + (rF - rB) * t;

  // 前缘 / 后缘圆环
  ctx.beginPath();
  ringPath(cf, rF);
  stroke(1.5, 0.9);
  ctx.beginPath();
  ringPath(cb, rB);
  stroke(1, 0.9);
  // 四条母线（侧视时收为两条轮廓线）
  ctx.beginPath();
  for (const phiDeg of [0, 90, 180, 270]) {
    const phi = phiDeg * DEG;
    const dir = add(mul(u, Math.cos(phi)), mul(v, Math.sin(phi)));
    seg(add(cb, mul(dir, rB)), add(cf, mul(dir, rF)));
  }
  stroke(1, 0.5);
  // 筒身环纹
  ctx.beginPath();
  ringPath(lerpV(cb, cf, 0.3), rAt(0.3), 20);
  ringPath(lerpV(cb, cf, 0.62), rAt(0.62), 20);
  stroke(0.5, 0.25);

  // 叉臂 + 抱箍：枢轴球 → 筒身
  const cm = mul(d, 0.14 * mh);
  ctx.beginPath();
  seg(mul(d, rb * 0.6), cm);
  stroke(1.5, 0.9);
  ctx.beginPath();
  ringPath(cm, 0.1 * mh, 20);
  stroke(1, 0.5);

  // 目镜：筒尾沿轴向后伸出的小圆筒
  const e0 = add(cb, mul(d, -0.02 * mh));
  const e1 = add(cb, mul(d, -0.13 * mh));
  const rE = 0.028 * mh;
  ctx.beginPath();
  ringPath(e1, rE, 16);
  stroke(1, 0.9);
  ctx.beginPath();
  for (const phiDeg of [90, 270]) {
    const phi = phiDeg * DEG;
    const dir = add(mul(u, Math.cos(phi)), mul(v, Math.sin(phi)));
    seg(add(e0, mul(dir, rE)), add(e1, mul(dir, rE)));
  }
  stroke(0.5, 0.5);

  // 寻星镜：筒背侧平行小圆筒 + 两道支架
  const fOff = mul(v, (rF / mh + 0.05) * mh);
  const f0 = add(lerpV(cb, cf, 0.52), fOff);
  const f1 = add(lerpV(cb, cf, 0.82), fOff);
  const rFnd = 0.024 * mh;
  ctx.beginPath();
  for (const t of [0.56, 0.76]) {
    seg(add(lerpV(cb, cf, t), mul(v, rAt(t))), add(lerpV(cb, cf, t), fOff));
  }
  stroke(0.5, 0.5);
  ctx.beginPath();
  ringPath(f0, rFnd, 14);
  ringPath(f1, rFnd, 14);
  stroke(1, 0.9);
  ctx.beginPath();
  for (const phiDeg of [90, 270]) {
    const phi = phiDeg * DEG;
    const dir = add(mul(u, Math.cos(phi)), mul(v, Math.sin(phi)));
    seg(add(f0, mul(dir, rFnd)), add(f1, mul(dir, rFnd)));
  }
  stroke(0.5, 0.5);
  // 铜橙唯一点缀：寻星镜前端
  const tip = proj(add(f1, mul(d, 0.012 * mh)));
  ctx.globalAlpha = 0.9 * alpha;
  ctx.fillStyle = `rgba(${copper},1)`;
  ctx.beginPath();
  ctx.arc(tip.x, tip.y, 1.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // 枢轴球（架顶，最后绘制压住腿/臂接点）
  ctx.beginPath();
  ctx.arc(px, py, rb, 0, Math.PI * 2);
  stroke(1.5, 0.9);

  ctx.restore();
}
