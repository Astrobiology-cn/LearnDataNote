# Components — Sanctuary On The Moon

> 基于 raw.json 提取的 HTML 结构 + 截图核对。class 名为原站命名，仅作结构参考。

## Header / 导航

- `position: fixed`，透明底，无边无阴影，直接浮于场景之上
- 结构：`Header > Header-wrapper > [logo链接] + [nav 链接组] + [CTA + 语言切换]`
- logo：SVG 字标（白色，月牙图形替代字母 C），`--animated` 类控制入场
- 链接：11px uppercase、letter-spacing 0.2em、`AppLink --animated`；当前页 `nuxt-link-exact-active` 显示下划线（::after 从左展开动画）
- 右端两个方块按钮：copper 描边（PRESS KIT）、白色描边（FR）
- 移动端：`Header-navClose` ✕ 按钮，导航折叠为全屏抽屉

```html
<header class="Header --show">
  <div class="Header-wrapper">
    <a class="Header-logoLink" href="/" aria-label="Back to homepage">
      <svg class="Header-logo"><!-- 字标 --></svg>
    </a>
    <nav>
      <a class="AppLink --animated">VISION</a>
      <a class="AppLink --animated">DISCS</a>
      <!-- ... -->
    </nav>
    <a class="AppButton --copper-outline">PRESS KIT</a>
    <a class="AppButton --white-outline">FR</a>
  </div>
</header>
```

**Tokens**: text.primary / border.accent / fontSize.xs / letterSpacing.label

## Hero（首屏场景）

- 满屏深空蓝 + 星球图片（`<picture>` 多分辨率 lazyload，`fit-contain`）
- 中心：超大字标 + 一行副标题（白 70%）
- 背景层：1px 白 15% 多面体线框，与标题叠压
- 入场：logo/标题 `translate3d(0,50px,0) → 0` + opacity，easeOutQuint

## CTA 按钮（AppButton）

- `border: 1px solid #EA6D15; background: transparent; color: #fff; border-radius: 4px`
- 11px / uppercase / 0.2em / padding 16px 32px
- hover：1s easeOutQuint 填充 copper；可带小 SVG 图标（download 等）
- 状态：default（描边）→ hover（填铜）→ active（稍暗）

```html
<a class="AppButton">
  <svg class="AppButton-svg"><!-- icon --></svg>
  PRESS KIT
</a>
```

## 数据高亮 Badge

- copper 实底 + 白色 11px 粗体大写，inline 嵌在标题文字中
- 例：`UP TO 7 BILLION [PIXELS PER DISC] NEARLY 100 BILLION [TOTAL PIXELS]`

## 轮播箭头（场景切换）

- 正圆（50%）、1px 白 15% 描边、透明底、内嵌三角 SVG
- 中间页码 `1 — 9`，当前数字 copper 色
- hover：描边转 copper（0.5s）

## Footer

- `position: relative`，深空蓝底
- 结构：`footer__container > ctas > cta（Press Room 等大 CTA 卡片）+ 社媒图标行 + 法律链接`
- 社媒图标：单 SVG（Instagram 等）、白色、hover 转 copper
- 文字：`AppText-1`（标题）/ `AppText-3`（正文）+ `--white` 修饰类

## 邮件订阅表单（LandingForm）

- 单行：email input（透明底 + 底部 1px 白线）+ 圆形提交按钮（信封 SVG）
- 入场动画：`translate3d(0, 50px, 0) → 0` + opacity 0→1
- 错误态：`--has-error` 修饰类

## 固定控件

- 右下角音频开关：1px 白描边小方块（喇叭 SVG + ✕ 状态切换）
- 左下角 ✕：当前场景/抽屉关闭
