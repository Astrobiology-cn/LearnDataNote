/**
 * canvasTheme — 2D canvas 场景的统一取色入口（卷二 2.5 实现规则 1/2）。
 *
 * 颜色经 getComputedStyle(document.documentElement) 读 CSS 变量（HSL 通道），
 * 借浏览器 computed style 精算为 rgb()（与 CSS 渲染同一舍入，不手写 HSL→RGB）；
 * MutationObserver 监听 <html> 的 .dark class 变更，切换时重取色。
 *
 * 取色纪律（与既有硬编码基线渲染一致）：
 *  - main/rgb  = --foreground（深 #FFFFFF / 浅 #0B1533，线稿与星点主色）
 *  - bgRgb     = --background（深 abyss #080E21 / 浅 parchment #F5F3EE）
 *  - COPPER    = 常量 '234,109,21'（#EA6D15）：--primary 令牌实际解析为
 *    #F1690E（24 89% 50%），与规格铜橙存在偏差；在令牌修正前 canvas 铜橙
 *    维持硬编码，避免渲染漂移（见 R2 交付报告）。
 */

/** HSL 通道字符串（如 '226 65% 12%'）→ 浏览器精算的 rgb() 字符串 */
export function hslVarToRgb(varValue: string): string {
  const div = document.createElement('div');
  div.style.color = `hsl(${varValue.trim()})`;
  div.style.position = 'absolute';
  div.style.visibility = 'hidden';
  div.style.pointerEvents = 'none';
  document.body.appendChild(div);
  const rgb = getComputedStyle(div).color;
  document.body.removeChild(div);
  return rgb;
}

/** 'rgb(11, 20, 50)' → '11,20,50'（供 rgba() 模板拼接） */
export function rgbTriplet(rgb: string): string {
  return rgb
    .replace(/^rgba?\(|\)$/g, '')
    .split(',')
    .slice(0, 3)
    .map((s) => s.trim())
    .join(',');
}

export type CanvasTheme = {
  isDark: boolean;
  main: string; // --foreground 计算色（canvas fillStyle/strokeStyle 直接用）
  rgb: string; // main 的 'r,g,b' 三元组
  bgRgb: string; // --background 的 'r,g,b' 三元组
};

/** 读取当前主题的 canvas 取色（挂载时 + 主题切换时各调一次） */
export function readCanvasTheme(): CanvasTheme {
  const cs = getComputedStyle(document.documentElement);
  const isDark = document.documentElement.classList.contains('dark');
  const fg = hslVarToRgb(cs.getPropertyValue('--foreground') || '0 0% 100%');
  const bg = hslVarToRgb(cs.getPropertyValue('--background') || '228 61% 8%');
  return { isDark, main: fg, rgb: rgbTriplet(fg), bgRgb: rgbTriplet(bg) };
}

/** 监听 <html> .dark 变更，切换即回调（调用方负责重取色并重绘当前帧） */
export function observeCanvasTheme(cb: () => void): () => void {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => mo.disconnect();
}
