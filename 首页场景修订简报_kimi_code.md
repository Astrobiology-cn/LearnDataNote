# 首页场景设计修订简报（交付 kimi code 执行）

> 用途：把产品方（用户）对首页六幕场景的口头反馈，翻译成可直接落地的开发指令。
> 读者：kimi code（编码 Agent）。请按本简报逐条执行，不要自行臆测风格。
> 基线：当前代码处于「重写前」冻结基线（此前曾严格对齐提示词后被回退）。本简报的修订是在该基线之上进行；其中「火箭改线稿 / 统一入口线稿 / 行星换生成贴图」等项，实际等同于部分回到此前被回退的写法，**以本简报为准**。

---

## 0. 全局纪律（每条修订都必须遵守）

1. **线稿语言统一**：所有 2D canvas 图形（火箭、工具箱、射电望远镜、卫星、飞船、信号接收器，以及学者入口北斗）必须走**同一套线稿纪律**——以现有 `KnowledgeScene` 的望远镜（`scopeLineArt.ts`）为质量标杆：
   - 仅描边、透明填充（刻意填充的强调块除外，如馈源舱铜橙菱形）。
   - 三档线宽：轮廓 1.5 / 结构 1.0 / 纹理 0.5；`lineJoin`/`lineCap = round`。
   - 三档透明度：0.9 / 0.5 / 0.25。
   - 端点必须落在轮廓上，无悬空出头；左右对称的结构严格对称。
2. **强调色规则（重要）**：铜橙 `#EA6D15` 是**唯一**强调色，**恒定**于深/浅两种模式。任何入口/图形在**鼠标未靠近、未激活**时，**不得使用铜橙**；铜橙只出现在 hover / 激活 / 被电波扫到的瞬间脉冲。入口图标默认用主题前景色（`--foreground`），hover 才转铜橙。
3. **深 / 浅双模式**：每一项改动都必须在深色（`#080E21` 深渊）与浅色（`#F5F3EE` 羊皮纸）下各验证一次。前景/背景随主题走；铜橙两模式恒定。
4. **可重复非倒放**：标题成形/飞散沿用「进入重新实例化、离开消解、回流重新成形」的模型，禁止把离场动画倒放当成回流。
5. **离屏暂停**：每个 canvas 仍须保留 `IntersectionObserver` 离屏暂停 rAF（性能纪律，勿删）。

---

## 1. 跨场景编排

### 1.1 Hero ↔ 第二幕火箭：从星球背后飞出
- **现状**：Hero 行星滚动到 `scrollProgress > 0.55` 时淡成「幽灵圆环」（`PlanetCanvas.tsx` 中 `uOpacity` 降到 ~0.18）；第二幕火箭（`RocketManifesto.tsx`）当前是**独立**地从屏幕左侧远处小点逼近，与 Hero 无联动。
- **期望**：火箭的**入场**应看起来像「从星球背后飞出来」——即火箭起点锚定在 Hero 行星淡出时的屏幕位置（画面中央偏上），从星球后方探出、再向前飞近；随后按现有意图「飞近→停靠→再飞远」。
- **实现要点**：
  - 让 `RocketManifesto` 能拿到 Hero 行星末态的屏幕坐标（通过共享滚动进度或一个简单的跨组件坐标上下文；两幕当前都有各自的 `scrollProgress`/`ScrollTrigger`，需对齐时序：Hero 淡出段 ≈ 第二幕入场段）。
  - 重写 `pose()` 的入场段：起点 `x/y` 取行星末态位置，火箭从「星球背后」（被星球遮挡感，可让火箭在行星淡出完成前从其后方露出机头）过渡到前方；**去掉当前 `Math.pow(sPos, 4)` 那种「生硬由小变大」的幂曲线**，改用透视式 `scale = f(z)`（如 `scale = base / (dist)` 让远处真小、近处缓增）配 `easeInOut`，让「从宇宙深处飞近」更顺滑、有景深，而不是线性/硬幂放大。
  - 保留「再飞远」：离场段仍让火箭缩回远处小点消失（用户认可飞远）。

### 1.2 第三幕（学科知识）↔ 第四幕（学者信息）：过渡去硬边界
- **现状**：`KnowledgeScene` 尾部有显式「地面下沉 15%H 淡出」的**地平线弧**，`ScholarsScene` 星野从另一块 canvas 开始；两者上下堆叠，交界处有一条明显分界线/硬切。
- **期望**：两幕之间过渡自然、无明显分界。地平线不应用一条硬边收尾；星野应更早地、渐进地渗入，使「地面沉降」融进「星空浮现」而非硬切。
- **实现要点**：
  - `KnowledgeScene` 的 `horizonGeom`/地面在 section 顶部边缘渐隐为透明，不要留下清晰的水平实线收口。
  - `ScholarsScene` 的星野入场淡入（见 4.1）提前、拉长，使其在 Knowledge 地面尚未完全淡出时就已经在背景层铺垫，由恒定星空层（`SharedSpaceBackground`）做胶水。
  - 两幕 canvas 之间不出现纯色断带；如必要，可让 Knowledge 地面颜色与 Scholars 背景同色系衔接。

---

## 2. 第一幕 Hero 行星：用 prompt 生成贴图替换地球照片

- **现状**：`app/src/components/PlanetCanvas.tsx` 的 `PlanetBody` 用 `useTexture(['/assets/2k_earth_daymap.jpg', '/assets/2k_earth_nightmap.jpg'])` 加载**真实地球照片**做昼/夜贴图；`StarDome` 用 `2k_stars.jpg`。
- **期望**：不再用真实地球照片，改由**图像生成 prompt** 产出一张契合 Sanctuary 设计语言（深蓝 `#0B1533`/深渊 `#080E21` + 铜橙 `#EA6D15`、安静恒久、知识方舟意象）的**风格化行星**贴图，替换上述地球贴图。
- **实现要点**：
  - 用文末「附：行星贴图生成 Prompt」生成 **等距柱状投影（equirectangular）2:1** 的昼面贴图，建议再生成一张夜面（城市灯）贴图；保存为 `app/public/assets/planet_day.jpg` 与 `app/public/assets/planet_night.jpg`（或覆盖原 `2k_earth_*.jpg`）。
  - 修改 `PlanetCanvas.tsx` 的 `useTexture([...])` 路径指向新贴图；昼/夜 shader 逻辑（`EARTH_FRAGMENT` 的 day/night 混合、晨昏线）**保留**。
  - 行星外貌应是「类方舟/远方安宁星球」，不是写实地球；大气壳（`Atmosphere`）颜色随主题微调即可。
  - 浅色模式下确认行星与羊皮纸底对比舒适（目前 `StarDome` 仅深色显示，浅色靠 `StarField` 点云，保持）。
  - 若图像生成由用户侧完成，kimi 只需把路径接好并验证打包通过。

---

## 3. 第二幕 火箭宣言（RocketManifesto）

文件：`app/src/components/RocketManifesto.tsx`；火箭素材 `app/public/assets/clean/{dark,light}/rocket.svg`（被本幕 `drawImage` 与第五幕飞船 sprite 共用）。

### 3.1 火箭图稿改线稿（对齐望远镜质量）
- **现状**：火箭用 `drawImage` 直接栅格化**实心 SVG 剪影**（`rocket.svg` 是单 path `fill` 实心、无描边），与第三幕望远镜的 canvas 程序化线稿完全不同档。
- **期望**：火箭改成像望远镜那样的**高质量 canvas 线稿**（仅描边、透明填充，铜橙/深蓝墨描边），母题仍是「远行的舟 / 方舟（递给未来的信）」。
- **实现要点**：新建 `app/src/components/backgrounds/scenes/rocketLineArt.ts`（参照 `scopeLineArt.ts` 的写法与线稿纪律），在 `RocketManifesto` 的 `drawRocket` 里用参数化路径绘制箭体/尾翼/舷窗/引擎喷口，**删除 `drawImage(rocket.svg)` 调用**。保留腹部「宣言镂空 + 铜橙细描边」的排印。

### 3.2 宣言文案字体与审美贴合整体风格
- **现状**：宣言用 `Noto Serif SC` 600 印在箭体腹部镂空；用户认为字体/审美与整体不搭。
- **期望**：宣言字体与 Sanctuary 整体排版（衬线碑体、铜橙细描边、克制）一致，且**在箭体上可读、优雅**，不喧宾夺主。
- **实现要点**：沿用站点衬线显示字体（Noto Serif SC）；描边用铜橙、字重适中；若腹部面积小导致难读，可适度放大声明区或考虑「声明作为独立标题层、箭体仅作载体」的版式（与用户在 3.4 对 Our Mission 的考量一并权衡）。

### 3.3 入场动效：从宇宙深处顺滑飞近（非生硬缩放）
- **现状**：`pose()` 入场段 `scale = lerp(0.05,1, pow(smooth(u),4))`——远处几乎不长大、临近骤增，用户感到「生硬由小变大」。
- **期望**：飞近要有「从宇宙深处逼近」的景深顺滑感，去掉硬幂曲线；并结合 1.1 从星球背后飞出。
- **实现要点**：入场段改用透视缩放（如 `scale = clamp(minScale, base/(dist+...))`）配 `easeInOut`；位置用更长区间的 `smoothstep`，让「远慢—近快—刹停」更自然；尾焰长度仍由滚动速度驱动、停靠熄灭（现有逻辑可保留）。

### 3.4 Our Mission 字样：大小 / 时机 / 动画重新考量
- **现状**：`label-plate` 写死在 `top-10` 居中、常驻、无动画。
- **期望**：重新审视——尺寸克制；**出现时机**与火箭停靠（宣言淡入）同步而非常驻；入场/出场用 `E-FADE`（cubic-bezier(0.455,0.03,0.515,0.955)）淡入淡出；与火箭/宣言构成一套语言。
- **实现要点**：把 Our Mission 的可见性绑到火箭 dock 阶段（参照 Knowledge/Scholars 铭牌「组装完成后淡入、划走先淡没」的状态机），移除常驻硬摆放。

### 3.5 联动 Hero（见 1.1）+ 浅/深双模式（见 0.3）
- 本幕所有描边/镂空底色在深(`#080E21`)/浅(`#F5F3EE`)下验证；铜橙恒定。

---

## 4. 第四幕 学者信息（ScholarsScene）

文件：`app/src/components/backgrounds/scenes/ScholarsScene.tsx`

### 4.1 星野「从暗到亮」应缓慢、柔和
- **现状**：场景入场亮起由 `gsap.to(fadeObj, {v:1, scrollTrigger:{trigger:wrap, start:'top bottom', end:'top 40%', scrub:true}})` 驱动——即**跟滚动位置/速度**走，快速滚动时星野会「啪」地亮起，显得突兀。
- **期望**：星野应**随时间缓缓从暗变亮**，与滚动速度解耦，柔和不跳变。
- **实现要点**：进入视口后，用**时间驱动**的缓动把 `fadeObj.v` 从 0 渐升到 1（约 1.2–1.6s，`easeOutCubic`/E-FADE），离开时反向；移除或延长原 `scrub` 范围使其不再受滚动速度主导。

### 4.2 星座图案要标准
- **现状**：`TEMPLATES`（约 193–287 行）是手写归一化坐标，属写意近似，与真实星座形状偏差大。
- **期望**：采用**天文上准确**的相对星位（Cassiopeia 仙后 W、Orion 猎户、Lyra 天琴、Cygnus 北十字、Scorpius 天蝎、Crux 南十字、Leo 狮子、Pegasus 飞马、Aquila 天鹰、Taurus 金牛、Corona Borealis 北冕等），保持 `alpha≈0.15`、背景星不连网。
- **实现要点**：用真实星图的相对坐标（RA/Dec 或标准星图比例）重填 `TEMPLATES` 的 `stars`；`chain` 连线顺序按真实星名连线；`CONSTELLATION_SETS` 的排布位置可保留。

### 4.3 入口北斗：未 hover 不用强调色（见 0.2）
- **现状**：`dipMode` 在标题组装完成瞬间切到 `lighting`→`lit`，北斗**自动点亮铜橙**（非 hover）。
- **期望**：北斗默认主题前景色；**仅 hover 七星形**时才转铜橙并浮现「进入学者信息」。
- **实现要点**：去掉组装完成即 `lighting` 的逻辑；铜橙只来自 `dipHover` 分支（`draw` 内 `copA` 仅由 `hov` 贡献，移除 `dipLitF` 的常亮铜橙）。

---

## 5. 第三幕 学科知识（KnowledgeScene）

文件：`app/src/components/backgrounds/scenes/KnowledgeScene.tsx`

### 5.1 KNOWLEDGE 消散时机：字样离开页面即消散
- **现状**：`phaseObserver` 在 `intersectionRatio < 0.25`（**整段 section** 几乎离屏）才 `startScattering`；用户希望**字样本身不在页面内**就消散。
- **期望**：当 KNOWLEDGE 标题（粒子拼字区）离开视口时即飞散，而不是等整幕滚没。
- **实现要点**：对**标题元素/粒子目标区**单独做 `IntersectionObserver`（或按标题包围盒计算），其离开视口即触发 `startScattering`；进入（≥0.55 或标题进入）重新 `startForming`。

### 5.2 工具箱开盖方式：绕铰链向后翻，不要沿缝转
- **现状**：`toolbox-lid` 用 `transform-origin: 50% 100%`（箱盖底沿中心）+ `rotate(-100deg)`；用户感知为「沿缝旋转」，不是向后翻开。
- **期望**：箱盖应像**绕后沿铰链向后翻转打开**（露出箱内铜橙微光），而非在底面中心轴旋转。
- **实现要点**：把 `transform-origin` 改到**箱盖后下沿**（如 `100% 100%` 或对应铰链线），旋转轴改为绕该铰链向后（等效 `rotateX` 或适当的 2D 旋转让盖向后倒），开合角约 `-100°~ -110°`；保留 hover 箱内铜橙径向微光 + 「进入学科知识」文字浮现。

### 5.3 望远镜线稿保留（用户满意）
- 第三幕望远镜（`scopeLineArt.ts`）用户满意，**勿动**其造型；仅配合 5.2 工具箱与全局线稿纪律做一致性核对。

---

## 6. 第五幕 外部资源（ResourcesScene）

文件：`app/src/components/backgrounds/scenes/ResourcesScene.tsx`；入口图标在文件末尾 `<svg class="receiver">`（约 980–1003 行）。

### 6.1 电波应为同心圆
- **现状**：`ringGeom` 故意做成**非对称扩散椭圆**（`cx = ring.x + 0.6r`、`ry = 0.85r`，朝 RESOURCES 方向偏）。
- **期望**：电波是**同心圆**（以馈源为圆心的对称圆环），向外扩散、越远越淡。
- **实现要点**：改 `ringGeom` 为 `rx = ry = r`、`cx = ring.x`、`cy = ring.y`（去掉 0.6r 偏移与 0.85 压扁）；铜橙、按半径衰减保留；标题流光判定（归一化距离 0.9~1.1）逻辑不变。

### 6.2 粒子发射前不要从旋转曲线突变成方块
- **现状**：ambient 阶段粒子绕馈源做**旋转曲线**漂浮（`drawParticles` 中 `sin/cos` 利萨茹）；但 `startForming` 里把 `p.x/p.y` 重置为 `fp.x + (random-0.5)*70` 的**随机方块**，再飞向目标——于是发射瞬间「曲线→方块」跳变。
- **期望**：发射前粒子**始终保持在旋转曲线上**，从曲线当前位置平滑飞向字母目标，不要先 snapping 成方块。
- **实现要点**：`startForming` 中**删除**对 `p.x/p.y` 的随机重置；直接以 ambient 帧已更新的当前位置作为 `sx/sy`（`p.sx = p.x; p.sy = p.y`），保持曲线连续性再启程。

### 6.3 卫星 / 飞船太小，尤其卫星造型
- **现状**：卫星仅 `r≈2.2` 的小圆点（`drawSatellites`）；飞船 sprite `drawImage(img,-8,-8,16,16)` 仅 16×16。
- **期望**：适当放大；卫星应有**像样的线稿造型**（本体 + 太阳能板 + 天线），不只是点；飞船也放大并提升线稿质量。
- **实现要点**：卫星改为 canvas 线稿（矩形本体 + 网格太阳能板 + 天线，参考 `scopeLineArt` 纪律），尺寸放到与场景协调（如本体 ~10–14px、太阳能板展宽）；飞船 sprite 放大到约 28–36px，并改用更精细的线稿资源（可新增 `clean/{dark,light}/ship.svg` 线稿，替换当前实心 `rocket.svg` 复用）。

### 6.4 入口线稿风格统一 + 未靠近不使用强调色（见 0.2）
- **现状**：本幕 `receiver` 入口用 `currentColor`（默认 muted，hover 转 `text-primary` 铜橙）——这一处基本符合；但**全站入口需统一**为同一线稿语言、且默认无强调色。
- **期望**：四个入口（望远镜工具箱 / 学者北斗 / 外部资源接收器 / 以及第二幕若有的入口）线稿风格、线宽、默认色一致；默认全为前景色，铜橙仅 hover。
- **实现要点**：以望远镜工具箱线稿为参照，统一各入口的描边纪律；确认 Scholars 北斗已按 4.3 去除常亮铜橙；本幕 `receiver` 维持 currentColor 默认、hover 铜橙即可。

### 6.5 信号接收器换新造型
- **现状**：末尾 `<svg class="receiver">` 是简易「碟+指示灯+桅杆」线稿（约 980–1003 行）。
- **期望**：换一个**更精致、与望远镜线稿同档**的接收器造型（仍表达「接收深空信号」语义）。
- **实现要点**：重画该内联 SVG，沿用线稿纪律（轮廓 1.5 / 结构 1.0 / 纹理 0.5，round 连接）；保留现有交互动画（指示灯慢闪 2s、hover 碟面微扬 + 铜橙急闪 0.4s + 文字浮现）。建议造型如：抛物面碟 + 馈源杆 + 基座，或信号塔/天线母题，与射电望远镜呼应但不雷同。

### 6.6 板块动效：无论何处进入都连贯自然
- **现状**：`phaseObserver` 用 `≥0.55` 成形 / `<0.25` 消解（整段 section 阈值），与 5.1 同类问题。
- **期望**：无论从哪个方向进入本幕，标题都**连贯、自然**地成形/消解；消散绑定「标题离开视口」而非整幕离屏（与 5.1 同一处理）。
- **实现要点**：消散判定改绑标题目标区离开视口（同 5.1 方案）；进入（标题进入视口）即重新 `startForming`（当前 IO 已能双向触发，保持「重新实例化、非倒放」）。

---

## 附：行星贴图生成 Prompt（英文，供 kimi code 或用户执行图像生成）

> 需生成 **等距柱状投影（equirectangular）2:1** 贴图，才能无缝包裹 `PlanetCanvas` 的球体 shader。昼/夜两张。

**Day map（昼面）：**
```
Seamless equirectangular planet surface texture, 2:1 aspect ratio, designed to wrap a 3D sphere with no visible seam. A calm, otherworldly planet in the "Sanctuary" aesthetic: deep indigo-to-ink base (#0B1533 / #080E21), soft continents rendered as muted low-saturation copper-terracotta landmasses (#EA6D15, desaturated), faint mineral vein lines, no harsh contrast, painterly and quiet, subtle pale blue-grey cloud bands, soft terminator-friendly shading, cinematic, ultra-detailed, 4k, no text, no logos.
```

**Night map（夜面，城市灯）：**
```
Seamless equirectangular night-side planet texture, 2:1 aspect ratio, matching the day map. Mostly dark indigo with sparsely scattered warm copper-gold city lights (#EA6D15) concentrated along the coastlines of the copper landmasses, soft glow, deep space black elsewhere, no text, no logos, 4k.
```

**使用**：生成后存为 `app/public/assets/planet_day.jpg` 与 `app/public/assets/planet_night.jpg`，并改 `PlanetCanvas.tsx` 的 `useTexture([...])` 路径指向它们；昼/夜混合 shader 保持不变。
