/**
 * rocketLineArt — RocketManifesto 3D 线框火箭，母题「远行的舟」。
 *
 * 参数化 3D 几何 + 弱透视投影（与 scopeLineArt 同一路数，不用 Three.js）：
 * 模型由环（头锥结合环/舷窗环/喷口唇口环等）、四条母线、四片尾翼边线构成，
 * 机头朝 +x、y 屏下、z 朝观察者；支持绕纵轴进动 roll（绕 x）、偏航 yaw
 * （绕 y，机头偏入/偏出屏幕纵深）、俯仰 tilt（绕 z，接入旧 2D tilt 逻辑），
 * 真三维旋转后经弱透视投影 s = F/(F+z) 画在 2D canvas 上——飞行缩放不再
 * 使用幂次假透视，全部由深度的 1/z 天然给出。
 *
 * 在调用方已 translate 到火箭中心的局部坐标系内绘制（不再 2D rotate），
 * 返回喷口唇口中心投影点（尾焰锚点）与整体透视缩放（尾焰尺寸随此缩放）。
 *
 * 线稿纪律与 scopeLineArt 一致：三档线宽 轮廓 1.5 / 结构 1.0 / 纹理 0.5，
 * 三档透明度 0.9 / 0.5 / 0.25，lineJoin/lineCap round，结构绕纵轴严格
 * 旋转对称（四环四翼，端点落在剖面上）；铜橙 #EA6D15 仅腹部一道环带。
 */

type V3 = { x: number; y: number; z: number };

export type RocketLineArtOpts = {
  L: number; // 全尺寸基准（停靠时火箭全长 ≈ 0.78L，px）
  main: string; // 主题主色（描边）
  copper: string; // 铜橙 rgb 三元组（仅腹部环带）
  alpha: number; // 整体透明度（随 pose 淡入淡出）
  z?: number; // 深度偏移（px，+z 远离观察者；缩放由投影天然给出）
  roll?: number; // 绕纵轴进动角（rad）
  yaw?: number; // 绕屏竖轴偏航（rad，+ 机头转入纵深，- 偏向观察者）
  tilt?: number; // 绕屏法向俯仰（rad，等同旧 2D rotate）
};

export type RocketLineArtOut = {
  tail: { x: number; y: number }; // 喷口唇口中心投影点（尾焰锚点，调用方局部系）
  s: number; // 整体透视缩放（尾焰长度/宽度随此缩放）
};

const DEG = Math.PI / 180;
const F_RATIO = 6; // 焦距 = 6L（弱透视，与 scopeLineArt 同一量级）

export function drawRocketLineArt(
  ctx: CanvasRenderingContext2D,
  o: RocketLineArtOpts,
): RocketLineArtOut {
  const { L, main, copper, alpha } = o;
  const zOff = o.z ?? 0;
  const roll = o.roll ?? 0;
  const yaw = o.yaw ?? 0;
  const tilt = o.tilt ?? 0;
  const F = F_RATIO * L;
  const sAll = F / (F + zOff);

  // 真三维旋转：先绕纵轴进动（x），再偏航（y），最后屏面俯仰（z，同 ctx.rotate 方向）
  const cr = Math.cos(roll);
  const sr = Math.sin(roll);
  const cyw = Math.cos(yaw);
  const syw = Math.sin(yaw);
  const ct = Math.cos(tilt);
  const st = Math.sin(tilt);
  const rot = (p: V3): V3 => {
    const y1 = p.y * cr - p.z * sr; // roll 绕 x
    const z1 = p.y * sr + p.z * cr;
    const x2 = p.x * cyw + z1 * syw; // yaw 绕 y
    const z2 = -p.x * syw + z1 * cyw;
    return { x: x2 * ct - y1 * st, y: x2 * st + y1 * ct, z: z2 }; // tilt 绕 z
  };
  // 弱透视投影：z 朝观察者为正（近处 s 更大），zOff 为整体深度
  const proj = (p: V3): { x: number; y: number } => {
    const q = rot(p);
    const s = F / Math.max(F + zOff - q.z, F * 0.1);
    return { x: q.x * s, y: q.y * s };
  };

  // 关键型值（L 的分数；机头 +x，原点箭体中心，数值沿用原 2D 线稿剖面）
  const NOSE = 0.38 * L; // 机头顶点
  const JOINT = 0.12 * L; // 头体结合环
  const R = 0.085 * L; // 箭体半径（细长舟体）
  const AFT = -0.26 * L; // 尾段结合环
  const NZ_B = -0.3 * L; // 喷口基部
  const NZ_R = 0.05 * L; // 喷口基部半径
  const NZ_T = -0.36 * L; // 喷口唇口（尾焰锚点）
  const NZ_TR = 0.068 * L; // 唇口半径
  const WIN_X = 0.24 * L; // 舷窗环（头锥上）
  const BELT_X = -0.06 * L; // 腹部铜橙环带
  const FIN_TIP = -0.4 * L; // 尾翼梢 x
  const FIN_R = 0.165 * L; // 尾翼梢半径

  // 二次贝塞尔求值（母线剖面与旧 2D 线稿的控制点一致）
  function quad(a: number, c: number, b: number, u: number) {
    return (1 - u) * (1 - u) * a + 2 * (1 - u) * u * c + u * u * b;
  }

  // 母线剖面 r(x)：卵形头锥 → 直筒 → 尾段收缩 → 喷口扩张（x 递减采样）
  const profile: Array<{ x: number; r: number }> = [];
  for (let i = 0; i <= 6; i++) {
    const u = i / 6;
    profile.push({ x: quad(NOSE, 0.345 * L, JOINT, u), r: quad(0, 0.07 * L, R, u) });
  }
  profile.push({ x: AFT, r: R });
  profile.push({ x: NZ_B, r: NZ_R });
  for (let i = 1; i <= 3; i++) {
    const u = i / 3;
    profile.push({ x: quad(NZ_B, -0.34 * L, NZ_T, u), r: quad(NZ_R, 0.048 * L, NZ_TR, u) });
  }
  /** 剖面半径插值（舷窗环贴合头锥表面用） */
  function rAt(x: number) {
    for (let i = 1; i < profile.length; i++) {
      if (x >= profile[i].x) {
        const a = profile[i - 1];
        const b = profile[i];
        const k = (a.x - x) / (a.x - b.x || 1);
        return a.r + (b.r - a.r) * k;
      }
    }
    return R;
  }

  /** 垂直纵轴的圆环（结合环/舷窗环/喷口环），采样为 3D 折线 */
  function ringPts(x: number, r: number, n = 28): V3[] {
    const pts: V3[] = [];
    for (let i = 0; i <= n; i++) {
      const phi = (i / n) * Math.PI * 2;
      pts.push({ x, y: Math.cos(phi) * r, z: Math.sin(phi) * r });
    }
    return pts;
  }
  /** 方位角 phi 处的整条母线（机头顶点 → 喷口唇口） */
  function meridian(phi: number): V3[] {
    const dy = Math.cos(phi);
    const dz = Math.sin(phi);
    return profile.map((p) => ({ x: p.x, y: dy * p.r, z: dz * p.r }));
  }
  /** 方位角 phi 处的尾翼边线（前缘后掠至翼梢，后缘收回尾段结合环） */
  function finOutline(phi: number): V3[] {
    const dy = Math.cos(phi);
    const dz = Math.sin(phi);
    const pts: V3[] = [];
    for (let i = 0; i <= 5; i++) {
      const u = i / 5;
      pts.push({
        x: quad(-0.02 * L, -0.26 * L, FIN_TIP, u),
        y: dy * quad(R, 0.07 * L, FIN_R, u),
        z: dz * quad(R, 0.07 * L, FIN_R, u),
      });
    }
    for (let i = 1; i <= 5; i++) {
      const u = i / 5;
      pts.push({
        x: quad(FIN_TIP, -0.335 * L, AFT, u),
        y: dy * quad(FIN_R, 0.105 * L, R, u),
        z: dz * quad(FIN_R, 0.105 * L, R, u),
      });
    }
    return pts;
  }
  /** 翼肋：筒身 → 前缘中点（两端均落在已有线上） */
  function finRib(phi: number): V3[] {
    const dy = Math.cos(phi);
    const dz = Math.sin(phi);
    return [
      { x: -0.14 * L, y: dy * R, z: dz * R },
      { x: -0.254 * L, y: dy * 0.102 * L, z: dz * 0.102 * L },
    ];
  }

  function path(pts: V3[]) {
    for (const [i, p] of pts.entries()) {
      const q = proj(p);
      if (i === 0) ctx.moveTo(q.x, q.y);
      else ctx.lineTo(q.x, q.y);
    }
  }
  function stroke(lw: number, a: number) {
    ctx.globalAlpha = a * alpha;
    ctx.lineWidth = lw;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  if (alpha > 0) {
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = main;

    // ── 轮廓（1.5 / 0.9）：四条母线 + 喷口唇口环 + 四片尾翼（严格旋转对称）──
    ctx.beginPath();
    for (const phiDeg of [0, 90, 180, 270]) path(meridian(phiDeg * DEG));
    path(ringPts(NZ_T, NZ_TR));
    stroke(1.5, 0.9);
    ctx.beginPath();
    for (const phiDeg of [0, 90, 180, 270]) path(finOutline(phiDeg * DEG));
    stroke(1.5, 0.9);

    // ── 结构（1.0 / 0.5）：三道结合环 + 舷窗环 ──
    ctx.beginPath();
    path(ringPts(JOINT, R));
    path(ringPts(AFT, R));
    path(ringPts(NZ_B, NZ_R));
    path(ringPts(WIN_X, rAt(WIN_X) * 1.06, 20));
    stroke(1, 0.5);

    // ── 纹理（0.5 / 0.25）：舷窗内环、喷口内环、翼肋 ──
    ctx.beginPath();
    path(ringPts(WIN_X, rAt(WIN_X) * 0.82, 20));
    path(ringPts(NZ_T + 0.012 * L, NZ_TR * 0.7, 20));
    for (const phiDeg of [0, 90, 180, 270]) path(finRib(phiDeg * DEG));
    stroke(0.5, 0.25);

    // ── 铜橙唯一着色：腹部一道环带（原引擎核心点并入此环）──
    ctx.globalAlpha = 0.9 * alpha;
    ctx.strokeStyle = `rgba(${copper},1)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    path(ringPts(BELT_X, R));
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.restore();
  }

  return { tail: proj({ x: NZ_T, y: 0, z: 0 }), s: sAll };
}
