# Design System Guide — Sanctuary On The Moon

> 提取自 https://sanctuaryonthemoon.com/ ，作为行星科学网站重设计的基准规范。

## 0. Overview

- **定位**：月球时间胶囊项目的沉浸式官网，"太空圣殿"氛围的教科书级样本
- **设计语言**：纪念性（monumental）+ 极简 + 仪式感。一屏一个意思，一句大白话
- **技术形态**：Nuxt SSR + WebGL 滚轮驱动场景（scroll-jacking），更像一部"可滚动的电影"而非文档站
- **适用场景**：品牌首页 / 宣言页；知识内容页需在此语言上降密度适配

## 1. Design Principles

1. **一屏一义** — 每屏只传达一个概念（"24 DISCS MADE OF SAPPHIRE"），没有信息堆叠
2. **单一强调色的纪律** — copper `#EA6D15` 全站只在小面积出现（按钮描边、数字块、星点），稀缺性制造高级感
3. **巨字即图形** — 标题放到 9rem 级、全大写、加粗，文字本身就是画面主体
4. **细线几何做空间** — 1px 白 15% 的圆、多面体线框暗示"太空结构"，不抢内容
5. **动效是礼仪，不是表演** — 0.5~1s 的 easeOutQuint，缓慢、稳定、无弹跳；用户滚动像在进行一场仪式

## 2. Color Palette

见 `palette.md`（完整色板 + 使用规则）。核心：`#080E21` 底 + `#FFFFFF` 字 + `#EA6D15` 点缀 + 白色透明细线。

## 3. Typography

- **字体**：Rustica（商业几何无衬线，Futura 一脉）。**免费替代首选 Jost**，其次 Outfit / Montserrat；中文搭配思源黑体/苹方，**不要用衬线**——衬线是本项目当前网站与参考站最大的偏差
- **字阶**（实测）：

| 用途 | size | weight | 变形 | letter-spacing | line-height |
|---|---|---|---|---|---|
| 巨幕标题 | clamp(3rem, 8vw, 9rem) | 700 | uppercase | 0.02em | 1.0~1.1 |
| 章节标题 | 3rem (48px) | 700 | uppercase | 0.02em | 1.1 |
| 副标题 | 2.4rem | 500 | — | 0 | 1.1 |
| 正文 | 16~18px | 400 | — | 0 | 1.5~1.7 |
| 标签/按钮 | 11px | 500~700 | uppercase | 0.2em | 1 |
| logo 字标 | ~14px | 500 | uppercase | 0.4rem | 1 |

- **规则**：标题全大写 + 加粗 + 收紧字距；标签全大写 + 宽字距（0.2em）；正文 sentence case
- **对齐**：巨幕场景居中；双联场景（A LEGACY / A VAULT）左右对称分列

## 4. Spacing System

- 8px 基准；组件内间距 8/16/24，布局间距 48/96/160
- **章节间隔极大**（约 20vh+），场景之间舍得留整屏空白
- 巨字场景四周留白 ≥ 15vw，文字永远不被边缘挤压

## 5. Component Styles

### 5.1 顶部导航
- 透明底、无分隔线，直接浮在场景上
- 左：字标 logo（大写、0.4rem 字距，月牙图形替代字母 C）
- 中/右：11px 大写宽字距链接，hover 下划线动画（从左展开）
- 右端：CTA 按钮（PRESS KIT，copper 描边）+ 语言切换（FR，白色描边方块）

### 5.2 描边按钮（CTA）
- `border: 1px solid #EA6D15; background: transparent; color: #fff`
- 11px / uppercase / 0.2em / padding ~16px 32px / radius 4px
- hover：背景填充 copper（1s easeOutQuint 过渡 border-color/background）
- 变体：白色描边版用于次要操作（语言切换）

### 5.3 数据高亮块（badge）
- copper 实底小矩形 + 白色 11px 大写粗体，嵌在文字行内（`PIXELS PER DISC`）
- 用于关键数字/单位强调，每屏 ≤ 2 个

### 5.4 轮播箭头
- 50% 圆、1px 白色 15% 描边、透明底；hover 描边转 copper
- 中间页码 `1 — 9`，数字用 copper

### 5.5 细线几何装饰
- 1px 白 10~15% 大圆 / 多面体线框，作为背景图层与标题叠压
- copper 四角星 ✦ 点缀，每屏 1~2 颗，极小

### 5.6 页脚/音频控件
- 右下角音频开关：1px 白描边小方块图标按钮
- 左下角章节关闭 ✕

## 6. Shadows & Elevation

- **全站无阴影**。层级靠：明暗交替的 section 底色（#080E21 ↔ #0B1533 ↔ #000）、1px 描边、WebGL 景深
- 弹层（cookie 条）用纯白卡片 + 极浅环境阴影，是唯一的"亮面"元素

## 7. Animations & Transitions

| easing | 值 | 场景 |
|---|---|---|
| easeOutQuint | cubic-bezier(0.165, 0.84, 0.44, 1) | 绝对主力（51 处）：文字入场、hover、位移 |
| easeInOutQuad | cubic-bezier(0.455, 0.03, 0.515, 0.955) | 场景切换、滚动驱动动画 |
| easeInOutQuart | cubic-bezier(0.77, 0, 0.175, 1) | 大幅变形、遮罩展开 |

- 时长：hover 0.3~0.5s；入场 0.5~1s；场景级 1.6s 左右
- 典型动效：文字 fade-up 入场、下划线左展开、滚动驱动视差、星球 3D 旋转
- 必须尊重 `prefers-reduced-motion`

## 8. Border Radius

- 按钮/卡片：4px（近乎直角）
- 箭头/装饰：50% 正圆
- 不用大圆角卡片

## 9. Opacity & Transparency

- 文字三档：100 / 70 / 50%
- 线框两档：白 15% / 白 10%
- 遮罩：深空蓝 50%

## 10. Responsive Design

- 巨字用 clamp() 流式缩放（3rem → 9rem）
- 移动端：导航折叠为汉堡；双联场景改上下堆叠；巨字降至 3rem

## 11. 与当前项目的差距（关键！）

| 维度 | 参考站 | 当前 PlanetaryWeb | 行动 |
|---|---|---|---|
| 标题字体 | Rustica（几何无衬线） | Noto Serif SC（衬线） | **换 Jost + 黑体** |
| 强调色 | #EA6D15 | #EA6D15 ✅ | 保持 |
| 主背景 | #080E21 / #0B1533 | #080E21 ✅ | 保持，补 #0B1533 交替 |
| 标题风格 | 全大写、巨字、收紧字距 | 衬线大标题 | 改全大写 sans |
| 页面节奏 | 一屏一义、整屏留白 | 信息密度偏高 | 首页降密度 |
| 动效 | easeOutQuint 统一 | 缓动不统一 | 统一令牌 |
