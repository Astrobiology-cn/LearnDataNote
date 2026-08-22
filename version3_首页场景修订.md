# version3 首页 Knowledge 拼字 + Scholars 星野 + 工具箱/望远镜 修订 (kimi 增量单)

覆盖基线: 修订简报 §4(星野) / §5.1(KNOWLEDGE标题) / §5.2(工具箱)。本单改 `KnowledgeScene.tsx` 与 `ScholarsScene.tsx`。
version2 的 §1-§7 仍生效, 但本单对其 工具箱开箱机制(version2 §4) 做覆盖(锚点自动开→hover开), 对其 三幕标题占比(version2 §7) 衔接执行。本单为准。

## 1 KNOWLEDGE 拼字重做 — `KnowledgeScene.tsx`

### 现状(待替换)
- 标题粒子由 `titleZoneRef` 的 IO(阈值0.55)触发 `startForming/startScattering` + 固定 0.9s `easeOutCubic` 时间补间 (`drawGlyphs` 550-597行) 驱动。
- 背景流星 `drawMeteors`(494-544行) 独立装饰, 不参与拼字。
- 拼字与滚动完全解耦 → 滚多快都 0.9s 拼完, 吃不到缓动。

### 期望(用户画面)
- 缓动靠近: 入站流星密度渐增 → 字形渐满 → 拼满 KNOWLEDGE。
- 缓动离开: 初始少量流星离开(慢) → 剩余离开越来越快 → 全部离开。
- 中途回划: 新流星补空位, **非**旧流星倒飞。

### 改法
- **删时间状态机**: 移除 `phaseObserver` 对 `startForming/startScattering` 的调用; `drawGlyphs` 中 0.9s 段(550-597)改为滚动驱动; 保留 `formed` 态铭牌/desc 淡入(改绑 scroll 满)。
- **新增 `glyphFillT`(0→1)**: `ScrollTrigger` 绑 `titleZone` 可见区间, `start:'top 60%'`(避免"圆在屏外"同类隐患), `scrub:0.6`(接 Lenis 缓动); `onUpdate: glyphFillT = self.progress`。
- **每字形点四态机**: `empty → inbound(流星飞入) → filled(落定显符号) → outbound(流星飞出) → empty`。
  - `inbound`: 从屏外(沿用 `drawMeteors` 右上 spawn 494-544)飞向目标坐标, 到达即 `filled`。**流星即拼字粒子本身**。
  - `filled`: 静止显示符号(前景 `main`+flicker); 偶发单颗飞出弧(保留 600/619)。
  - `outbound`: 从该点沿流星方向(朝左下, 角 `π*(0.72~0.82)`)飞出屏外渐隐; 速度乘 `(1-glyphFillT)` 或滚动速度 → 强化"越离越快"。
- **阈值分布**: 每点 `threshold = pow(random, 2)` 偏上段; `glyphFillT > threshold` 才填满 → 进时密度渐增、出时先慢后快(自动)。
- **合并原 meteor**: 主拼字由 inbound/outbound 承担; 保留 ≤3 颗装饰 ambient 流星(可选)。
- **可重复非倒放**: 状态绑 `glyphFillT`; 回流回升时空位新生成 inbound 补 → 满足 §二/§九。

### 参数(不变量)
- 字占比: 沿用 version2 §7 (`maxW=W*0.72, maxH=H*0.32, cx=W/2`); 不改 `sampleTargets`。
- 铜橙: 飞行中(inbound/outbound)铜橙高亮(保留 645 `COPPER`), filled 转前景 `main`; 双模式验证。
- 拖尾: 复用拖尾数组(max 6 点, 561行)。

## 2 SCHOLARS 星野缓动化 — `ScholarsScene.tsx`

### 现状(待替换)
- 星野亮度 `sf = fadeObj.v` (draw 744行)。
- 驱动: `fadeObserver`(1019-1026, IO 阈值0) → gsap 时间 tween: 进 1.4s `power3.out` 渐亮, 离 0.9s 渐隐(1010-1022)。注释明言"与滚动速度解耦" → 吃不到 Lenis 缓动, 突兀。

### 期望(用户画面)
- 星野随滚动缓动从暗变亮(进入渐亮, 非固定时长); 离开随滚动渐隐。吃到 Lenis 缓动拖尾。

### 改法
- 删时间驱动: 移除 `fadeObserver`/`fadeTo`/`fadeTween`/`fadeObj` 整块(1019-1030, 1010-1018; 428行删除或占位)。
- 新增 `sfT`(初值0): 两 `ScrollTrigger` 绑 `wrap` 行程:
  - ST-In: `start:'top bottom'`→`end:'top 30%'`, `onUpdate: sfT = self.progress`(渐亮); 欲更从容改 `end:'top 50%'`。
  - ST-Out: `start:'bottom 70%'`→`end:'bottom top'`, `onUpdate: sfT = 1 - self.progress`(渐隐)。
  - 中间 sfT 保持 1(星野常驻); 两者均 `scrub:0.6`。
- draw 改读: 744行 `const sf = fadeObj.v` → `const sf = sfT`。
- 保留: `pauseObserver`(972-986)、北斗 hover 铜橙、星座链、标题 IO 成形/飞散(version2/基线)。

### 参数(不变量)
- 进入 `top bottom→top 30%`; 离开 `bottom 70%→bottom top`; `scrub:0.6`。
- 双模式: `isDark` 下系数已按暗模式; 前景 rgb 走 CSS 变量。
- 可重复非倒放: 滚动回拨 sfT 自然回落。

## 3 第三幕 工具箱: 开合改 hover + 内部可见性 + 底边对齐 + 间距 — `KnowledgeScene.tsx` + `toolboxLineArt.ts`

### 3.1 开合改 hover 驱动(撤销 IO 自动开箱)
- **现状**: `toolboxObserver`(775-790, IO 阈值0.5) 进视口≥50% 即 `setLid(true)` 自动开箱, 与鼠标无关; 887-888 的 `onMouseEnter/Leave` 只设 `toolboxHoverRef`(仅控提亮 hoverT, 不控开盖)。
- **改法**: 删除 `toolboxObserver` 整块(773-790 含兜底 785-790)。开合改由 hover 驱动: 在 rAF 中让 `lidTarget` 跟随 `toolboxHoverRef.current`(true→`setLid(true, now)`, false→`setLid(false, now)`); 即鼠标进入 `.toolbox-entry` 才开、离开才合。lid 0.6s `easeOutCubic` 缓动保留(468-472)。
- **覆盖 version2 §4**: 原"锚点进视口自动开箱"作废, 改 hover 开合。

### 3.2 不开箱看不到内部(关工具绘制)
- **现状**: `toolboxLineArt.ts:156` `toolA = 0.55 + 0.45*openT` → 合盖(openT=0)工具仍按 0.55 透明度画出; 箱体是线框(透明), 故未开箱也透见扳手/直尺/齿轮。(白色辉光已 `openT>0.01` 才画, 141行, 正确。)
- **改法**: 内部工具绘制块(155-236行)加 `if (openT > 0.02) return;` 守卫; 且 `toolA = clamp01(openT / 0.6)`(随开盖从 0 渐显, 合盖为 0)。→ 合盖时只见空线框箱, 无内部; 开盖后工具渐显。

### 3.3 底边对齐: 后沿与地平线平齐(非前沿)
- **现状**: `toolboxLineArt.ts:67-74` `drop = -minBaseY` 把四底角**最低点**钉地; 当前俯仰下最低角是**前底角**→ 前沿贴地、后沿翘起, 与用户要求相反。
- **改法**: 落地基准改用**后下沿两底角**(z=-hd, y=0)的平均投影 y: 仅对 `bz=-hd` 的两个角求 `pose().y` 均值 `rearY`, `drop = -rearY`。→ 箱底后沿与地平线平齐, 前沿随俯仰自然抬起。

### 3.4 与望远镜拉开间距(望远镜不动)
- **现状**: 望远镜 `bx = W*0.72`(429行), 工具箱 `bx = W*0.765`(478行) → 仅差 0.045W, 视觉重叠。
- **改法**: 工具箱 `bx` 由 `W*0.765` 改为 `W*0.88`(478行), 与望远镜保持约 0.16W 间距; 望远镜 `W*0.72` 不动。

## 4 望远镜去铜橙 — `scopeLineArt.ts`

### 现状
- `scopeLineArt.ts:188-191` 寻星镜前端有**常驻铜橙点**(`rgba(${copper},1)`), 即用户感知的"靠近发射橙光"。
- `KnowledgeScene.tsx:447-456` 拖拽时枢轴铜橙辉光(仅 dragging, 非靠近)。

### 改法
- `scopeLineArt.ts:188-191` 铜橙点改前景色 `main`(去掉 copper 参数在此处的使用); 望远镜保持**纯前景色线稿**, 无任何铜橙点缀。
- 确保**不新增**任何 hover/靠近触发的橙色辉光; 望远镜线稿纪律与全站一致(铜橙仅 version2 指定处)。
- (可选)`KnowledgeScene.tsx:447-456` 拖拽铜橙辉光可一并改为中性色, 或保留作拖拽焦点指示——若用户介意"橙光"则改前景色。

## 全局纪律(不变量)
- 拼字/星野亮度**必须绑定滚动进度**(非固定时间补间), 保证吃到缓动; 回流新元素补空, 禁倒放。
- 沿用 version2: 铜橙 `#EA6D15` 仅强调(拼字飞行高亮/北斗 hover); 望远镜纯前景色无铜橙; 双模式色走 CSS 变量不写死。
- 工具箱: hover 开合、合盖不可见内部、后沿贴地、与望远镜间距 ≥0.16W。
