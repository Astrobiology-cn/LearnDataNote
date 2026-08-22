# version2 首页 3D 线框修订 (kimi 增量单)

覆盖基线: 修订简报 §1.1/§3/§5.2/§6 + 线稿规范 §2注记/§4 + 新增 HomePage 幕间距 + Scholars 字形 + 三幕标题字间距&占比。其余基线不变, 本单为准。

## 锚点机制 (工具箱/射电共用)
参照 `KnowledgeScene.titleZoneRef`: 不可见 div 锚点 + `IntersectionObserver`(阈值~0.5) + 进/出视口触发状态机 (**绝不倒放**)。工具箱/射电各加 `toolboxZoneRef` / `telescopeZoneRef`。

## 1 火箭 — `RocketManifesto.tsx` (现 2D canvas)
- 改: Three.js 3D wireframe — `Cylinder`箭体(锥化)+`Cone`头锥+尾翼2-4片(对称)+舷窗`Ring`+喷口`Cylinder`。`EdgesGeometry`+`LineSegments`+`LineBasicMaterial`, 色取 CSS 变量前景。
- 场景: 并入 `PlanetCanvas` 同场景/共享滚动 (退路: 双画布锁同阈值)。起点行星背面 (z大, 真实遮挡)→向前(z减)飞近→dock→飞出。
- 删 `pow(4)` 假透视; 位姿 `easeInOut`。
- 宣言+OurMission: HTML 浮层(绝对定位), dock 淡入/离场淡出, `Noto Serif SC` + 铜橙细描边。
- 铜橙仅腹部环。`rocket.svg` 废弃。

## 2 工具箱 — `KnowledgeScene.tsx` (现 hover 开盖 + 铜橙微光)
- 改: 动态 3D 线框 — `Box`箱+可开合盖(绕后下沿铰链轴)+提手+锁扣+内部工具剪影(扳手/直尺/齿轮)。置于地平线, 与望远镜并排。
- 锚点开箱: `toolboxZoneRef`, 进视口开箱(~-100° `easeOutCubic` 0.6s)/离视口合盖。
- 白光: 开箱时箱体内部白色径向辉光 (深 `rgba(255,255,255,a)` / 浅 柔白 0.7)。**严禁铜橙**(宝箱内部发光感)。
- 删 `.toolbox-lid` 翻转 + `.toolbox-inner-glow` 铜橙。
- hover: 线框高亮+文字浮现。仍是 `Link` 入口。

## 3 射电望远镜 — `ResourcesScene.drawTelescope` (现 2D 线稿)
- 改: 3D wireframe — `Lathe` 抛物碟面+馈源舱+支杆+塔架 `Cylinder`×3+配重。地平线主视觉。
- 锚点: `telescopeZoneRef`, 进视口装配/点亮。
- 保留: 点击发电波环(2D 同心圆, 基线已定)+碟面反推。铜橙仅馈源舱。

## 4 卫星/飞船 — `ResourcesScene.drawSatelliteLineArt` / `drawShipLineArt` (现 2D)
- 改: 3D 线稿 — 卫星: `Box`本体+双太阳能板+天线杆; 飞船: `Cylinder`舱+`Lathe`碟+RTG。
- 卫星降频: 删 `Math.random()<0.005` 每帧成组 → 每 14-22s 单颗(1-2颗), 不扎堆。飞船维持 25-40s。
- 轨迹: 直线 `s.x-=v` → 轻微纵向正弦 `y=baseY+A·sin((x/W)·k·π)`, `A≈6-14px`, `k≈1-2`。

## 5 幕间距缓动 — `HomePage.tsx`
- 改: 各幕间加 30-50vh `transition-band` (延续上幕末态色, 无新图形)。
- 拉长各 Scene `ScrollTrigger` start/end (如 `top bottom`→`center 65%`), 缓动更从容。
- 退场/进场解耦: 上幕消散在过渡带完成, 下幕成形在之后开始。
- 保留: 可重复非倒放 + 离屏暂停 rAF。

## 6 SCHOLARS 字形 — `ScholarsScene.buildLetterPaths` (现 x列蛇形+最近邻→网格感)
- 改: 提高采样密度 (`LETTER_COUNT` 500→900+, `step`↓), 笔画更实。
- 连线: 重画为沿笔顺/轮廓, 或取消字母内连线 (纯密集点阵成字)。去网格感。
- 保留星点成字: 进视口 55% 成形 / <25% 飞散, 可重复非倒放。字母星亮度 +30% 高于背景。

## 7 三幕标题 字间距 & 画面占比 统一 — KnowledgeScene/ScholarsScene/ResourcesScene
- 现状差异:
  - KNOWLEDGE (`KnowledgeScene.tsx:148`): `scale=min(1,(w*0.86)/textW)` — 宽上限86%视口、最大1:1不放大、水平居中。
  - SCHOLARS (`ScholarsScene.tsx:588`): `scale=min((W*0.6)/rawW,(H*0.34)/rawH)` — 宽60%×高34%、居中(cx=W/2,cy=H*0.36)。
  - RESOURCES (`ResourcesScene.tsx:135`): `scale=min(maxW/textW,maxH/textH,1.6)` — 允许放大1.6倍、中部偏右(非居中)。
  - 三者均无独立 letterSpacing, 字间距由字体测量决定, 疏密/字号观感不一致。
- 期望: 三幕标题视觉权重接近、字间距统一、均水平居中。
- 改:
  - 统一占比: 三幕约束到相近视口比例 (宽 ~72% 范围70-78%、高 ~32% 范围30-36%、cx=W/2 居中)。删 KNOWLEDGE 86%过宽、RESOURCES 1.6放大与偏右。
  - 统一字间距: 各标题离屏采样 canvas 设 `octx.letterSpacing` (如 `'0.08em'` 同比例), 三幕同字距, 粒子/星点自然继承。
  - 统一字体: 三幕用同一站点衬线显示字体, 保证字宽/字距观感一致。
  - 保留各自锚点/成形机制 (titleZoneRef / SCHOLARS 进视口55% / RESOURCES 锚点) 不变。双模式验证。

## 全局纪律 (不变量)
- 铜橙 `#EA6D15` 仅: 火箭腹环 / 望远镜 finder / 射电馈源 / 少量强调。工具箱用白光替代(禁橙); 学者北斗默认不橙。
- 双模式: 深 `#080E21` / 浅 `#F5F3EE`, 每处验证; 色走 CSS 变量不写死。
- 线宽/细线/严格对称 与火箭一致。
