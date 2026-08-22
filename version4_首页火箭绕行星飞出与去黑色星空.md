# version4_首页火箭绕行星飞出与去黑色星空

> 交付对象：kimi code。增量变更单，覆盖基线 `首页场景修订简报_kimi_code.md` 第二幕（RocketManifesto）入场叙事与 Hero 深色星空层，**以本单为准**；基线 2D 版与其余幕不动。
> 代码依据：`app/src/components/PlanetCanvas.tsx`、`app/src/components/RocketManifesto.tsx`、`app/src/components/backgrounds/scenes/rocketLineArt.ts`（均已实读）。

---

## §1 Hero 去除深色模式多出的黑色星空层

**文件：`app/src/components/PlanetCanvas.tsx`**

- 现状：`StarDome` 组件（第 142–158 行）在 `<Canvas>` 内以 `{isDark && <StarDome />}`（第 299 行）**仅在深色模式**加载 `2k_stars.jpg` 黑底星空天空盒（`sphereGeometry(90)`, `BackSide`, `opacity:0.5`）。浅色模式不加载 → 深色模式比浅色多一层黑色星空，与全局 `SharedSpaceBackground`（深蓝星空）叠加显突兀，明暗切换不一致。
- 改法：
  1. 删除 `StarDome` 函数定义（第 142–158 行整段）。
  2. 删除其调用 `{isDark && <StarDome />}`（第 299 行）。
  3. 保留 `StarField`（1400 点，`useIsDark` 双模式自适应配色/透明度）与全局 `SharedSpaceBackground`——删除后深色/浅色一致，仅剩这两层星空。
- 注意：`useTexture('/assets/2k_stars.jpg')` 封装在 `StarDome` 内，随组件删除自动消失，无需另删；`THREE` 仍被 `PlanetBody`/`Atmosphere`/`Spaceship` 使用，不要误删导入。

---

## §2 RocketManifesto：火箭自星球背后绕一圈螺旋落中央 + 居中放大

**文件：`app/src/components/RocketManifesto.tsx`（核心改 `pose()` 与 `draw()` 的 L）**
**投影无需改：** `rocketLineArt.ts` 的 `s = F/(F+zOff)`、`F=F_RATIO*L=6L` 已支持由 `zOff` 驱动远小近大；远小需 `zOff` 量级达 `Z_FAR≈F·15.66`（数万 px），仅靠屏幕坐标几百 px 不产生明显缩放——故"从背后远飞近"必须由大 `zOff` 驱动。

### 2.1 入场路径：绕行星一周 + 螺旋收至中央
- 轨道中心 `C = (0.5*W, 0.46*H)`（≈ Hero 行星屏位，火箭自此处"背后"绕出）。
- 常量：`ORBIT_END = 0.45`；`u = clamp01(t / ORBIT_END)`；`Z_FAR = F*(1/Z_SCALE - 1)`（沿用现有 `Z_SCALE=0.06`）。
- 角度：`φ = π/2 + 2π*u`（起点在"后方/上方"，整圈一周后回正）。
- 屏幕环（俯视倾斜，垂直压扁）：
  - `Rs = 0.34*min(W,H) * (1 - u)`（绕行同时向内收，呈螺旋）
  - `x = C.x + Rs*cos(φ)`
  - `y = C.y + Rs*sin(φ)*0.55`
- 深度与透明度：
  - `zOff = Z_FAR * (1-u)^1.6`（远→近，scale 0.06→1）
  - `alpha = E_FADE(clamp01((1 - zOff/Z_FAR)/0.55))`（从"背后"淡入，落中央满）
  - `dock = smooth(clamp01((t - (ORBIT_END-0.05))/0.05))`（临近中央收拢进动/微浮）
- 区间：
  - `t ∈ [0, ORBIT_END]`：上述轨道（绕一圈螺旋落 `C`）。
  - `t ∈ [ORBIT_END, OUT=0.62]`：保持 `x=C.x, y=C.y, zOff=0, alpha=1`（中央停靠窗口，宣言浮层淡入）。
  - `t > OUT`：沿用现有离场（飞向右上远去、`alpha→0`）。

### 2.2 居中放大"占比较大范围"
- `draw()` 中 `L = Math.min(W*0.62, 560)` 提升为 **`L_dock = Math.min(W*0.86, 820)`**（`zOff=0` 时 `s=1`，火箭全长≈`0.78*L_dock`≈640px，约视口宽 45–55%，`roll=π/4` 四翼展开更宽）。
- 若希望更满可上探 `0.9W/880`，但需确认不压住中央宣言文字（宣言浮层维持 `top-[52%]` 居中；火箭 belly 铜橙环在 `C.y` 下方约 `0.06*L_dock`，与宣言基本重合，无需挪）。

### 2.3 时序对齐"行星全黑 → 火箭居中"
- Hero 行星 `fade` 发生在首屏前 `0.8*vh`（`scrollProgress 0.55→1`，`PlanetBody` 内 `uOpacity=1-fade*0.82`），Rocket section 紧随其后。
- 火箭在自身 section 内 `t≈0.45–0.5` 到达中央，恰为 Hero 已全黑、Rocket 居中之时 → 视觉链为"行星暗去 → 火箭自原行星位绕出、螺旋落中央放大"。
- 可选增强（**不在本单必做**）：若要求火箭直接叠在暗化行星之上出现（更紧耦合），需把火箭 canvas 移入 Hero 并由 Hero 的 `scrollProgress` 驱动——架构改动较大，单列需求再做。

### 2.4 保形（不改）
- `yaw` 入场逻辑（机头偏观众、落中央转正）保留；`roll=π/4` 进动收敛保留；尾焰随滚动速度、停靠熄灭保留；`E_FADE = cubic-bezier(0.455,0.03,0.515,0.955)` 保留；`prefers-reduced-motion` 仍静态绘制中央清晰火箭。

---

## 验收要点
1. 深色模式滚动首屏：仅 `SharedSpaceBackground`+`StarField` 两层星空，无额外黑色星空。
2. 火箭入场：自屏幕中央偏后位置沿倾斜环绕行一周、由远及近淡入并螺旋收至正中央，落定放大（占视口较大范围），非直线飞近。
3. 滚动时序：行星全黑 → 火箭恰居中放大，叙事连贯。
