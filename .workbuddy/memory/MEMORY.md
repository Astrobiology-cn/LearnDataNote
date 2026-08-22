# 行星科学网站 · 长期项目约定

## 验收标准
- `首页场景开发提示词.md`（工作区根目录）是首页六幕场景的**唯一验收标准**，任何动效/造型改动都须逐条对照该文件，不得"差不多"。
- 六幕：Hero(3D地球) / Rocket宣言 / Knowledge学科知识 / Scholars学者信息 / Resources外部资源 / Join Us。首屏真实 `<h1>` 仅"行星科学"（不带"知识库"）；各 section 子页入口为**纯文字提示(.label-plate，无框无背景块)**，不放置卡片。

## 必须遵守的硬规则（来自提示词）
- **动效可重复非倒放（§二/§九）**：用 GSAP `ScrollTrigger` 四回调——`onEnter`/`onEnterBack`→聚拢(每次重新实例化粒子/星点)；`onLeave`/`onLeaveBack`→飞散消解。禁止用 IntersectionObserver 阈值做成形/飞散主驱动；IO 只用于离屏暂停 rAF。回流绝不能是退场动画倒放。
- **双模式取色（§十）**：提示词要求所有 canvas 颜色经 `getComputedStyle` 读 CSS 变量转 RGB、禁止写死 hex、监听 `.dark` 变更重绘。**实际现状（2026-07-29 读码核实）**：仅全局背景层 `components/SharedSpaceBackground.tsx` 的 `refreshColors()` 真正读 CSS 变量(`--foreground/--primary/--muted-foreground`)+MutationObserver 重绘；三幕 canvas 场景(Knowledge/Scholars/Resources)目前是每帧 `isDark ? '#fff' : '#0B1533'` 硬编码 hex，**未读变量**——与 §十 要求存在偏差，留待修订统一。铜橙 `#EA6D15` 两模式恒定。
- 造型需详尽：火箭/望远镜/工具箱/卫星/飞船/射电望远镜均为**线框**(stroke+透明 fill)，非实心 SVG 剪影。

## 技术栈
- React19 + Vite7 + TS + Tailwind3 + shadcn/ui；GSAP+ScrollTrigger、Lenis 平滑滚动、Three.js(Hero)、2D Canvas(其余五幕)。next-themes 切 `.dark` class。
- 构建：`cd app && npm run build`（tsc -b 严格 noUnusedLocals/Parameters，需 PATH 指向托管 node `/Users/etteraug/.workbuddy/binaries/node/versions/22.22.2/bin`）。

## 已知遗留
- 提示词§九建议抽 `<ParticleTitle>` 复用组件去 Knowledge/Scholars/Resources 三 Scene 重复代码，尚未做（不影响视觉与动效一致性）。

## 对标参考站（首页动效灵感来源）
- `https://sanctuaryonthemoon.com/` —— 叙事与本站同源（"Sanctuary / 递给未来的信"），是首页动效的对标对象。技术栈经 curl 分析为 **Nuxt3+Vite + Three.js(WebGL) + GSAP + ScrollTrigger(pin+scrub) + IntersectionObserver + 2D canvas + Swiper**；首页架构为 3D 月球/地球球体+纹理+星空粒子背景(starrybackgr/points)+GSAP 板块淡入/文字放大/浮动+OrbitControls 拖拽+ScrollTrigger 钉住滚动。本站技术选型与其高度一致，参考价值高。
- **逐帧编排已可自抓，不依赖用户录屏**：本环境已装 Playwright + Chromium（托管 node22.22.2 workspace `/Users/etteraug/.workbuddy/binaries/node/workspace`）。注意该站**不滚动 window**，改用虚拟滚动容器 `.Site-scrollmain`（`transform: translateY` 平移），GSAP/Lenis 未挂全局；驱动用 `page.mouse.wheel` 真实滚轮 + 轮询 translateY，每进度桶 DOM 探针采样元素 top/opacity 重建编排。产出：`对标站_视觉编排分析.md`（叙事分段表+手法+借鉴）、`playwright_capture/frames/`（25 帧+timeline.json+index.html 预览）。限制：本模型不支持读图（分析基于 DOM 文本）；代理网络致部分图片/字体/3D 贴图缺失。**当无头抓取漏掉 WebGL 贴图（401/连接关闭）时，以用户在真机浏览器观察到的口头描述为准**（比缺失截图的像素更可靠）——用户曾校正：视觉中心全程有圆形月球常驻、晨昏线随滚动推移、全黑瞬间翻为白色"源泉"。详见 `2026-07-28.md` / `2026-07-29.md` 日志。

## 文档 / 规格纪律
- 撰写《总体规格说明书》卷二等技术陈述时，凡涉及路由数量、技术栈版本、组件名、实现机制等，**必须先把代码读实再写**（如 `app/src/App.tsx` 路由表、`package.json` 依赖），禁止凭旧文档转述或凭印象估计数字/清单。曾误写"共 9 个路由"（实际 10 个 `<Route>` 且 `news` 无列表页），已被用户指正。
- **交付 kimi code 的修订文档统一用 `versionN_描述.md` 命名**（如 `version2_首页场景3D线框修订.md`），不要混用多套不同名称（如"修订简报/线稿规范/增量变更单"各自独立命名）。迭代时往同一 version 文件续写；新一轮需求则递增版本号开新文件（如 `version3_xxx.md`），**不回头改旧文档**。
- **增量文档模式 + versionN 命名**配合：基线文档（2D 版，如 `首页场景修订简报_kimi_code.md` / `首页线稿统一绘制规范_kimi_code.md`）稳定不动；每轮新要求写进对应的 versionN 文件，kimi 只需增量读 versionN 文件，避免全量重读。
- **给 kimi code 的交付：增量变更单模式**。凡是对已交付的修订文档提出**新要求**，一律写成**新的增量文档**（如 `首页第二幕3D方案_增量变更_kimi_code.md`），**禁止修改已交付的基线 md**（如 `首页场景修订简报_kimi_code.md` / `首页线稿统一绘制规范_kimi_code.md`）。原因：kimi 已读/将读基线全文，改旧文档会迫使它全量重读；新文档只需增量读一份即可。增量单须在开头声明**覆盖基线哪些章节、以本单为准**，并自包含该部分的完整方案。基线文档保持 2D 版本稳定不动（除非用户明确要求整体重写）。
