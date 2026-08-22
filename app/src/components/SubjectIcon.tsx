/* ── 学科细线几何图标 — 与 SpaceIcon 同一语言 ──
   stroke = currentColor, strokeWidth 1.5, fill none
   不透明度分层（深底校准）:
     装饰/外层  →  0.20–0.35
     次级结构   →  0.40–0.60
     焦点元素   →  0.75–0.90 */

interface SubjectIconProps {
  id: string;
  size?: number;
  className?: string;
}

export default function SubjectIcon({ id, size = 48, className }: SubjectIconProps) {
  const s = size;
  const sw = 1.5;
  const common = {
    width: s,
    height: s,
    viewBox: '0 0 48 48',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: sw,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    'aria-hidden': true,
  };

  switch (id) {
    /* ── 数理基础：坐标轴 + ∫ + 正弦波 ── */
    case 'math-physics':
      return (
        <svg {...common}>
          <line x1="7" y1="41" x2="43" y2="41" opacity="0.4" />
          <line x1="7" y1="41" x2="7" y2="5" opacity="0.4" />
          <path d="M 33 8 C 30 8 29 11 28 16 L 26 24 C 25 28 24 31 21 31" opacity="0.85" />
          <path d="M 11 34 Q 17 22 23 30 T 35 28 T 43 24" opacity="0.55" />
          <circle cx="23" cy="30" r="1.8" fill="currentColor" stroke="none" opacity="0.75" />
        </svg>
      );

    /* ── 行星科学基础：行星剖面 + 三层同心圈层 ── */
    case 'planetary-basics':
      return (
        <svg {...common}>
          <circle cx="24" cy="24" r="17" opacity="0.6" />
          <circle cx="24" cy="24" r="11" opacity="0.4" />
          <circle cx="24" cy="24" r="5.5" opacity="0.5" />
          <circle cx="24" cy="24" r="1.8" fill="currentColor" stroke="none" opacity="0.85" />
          <path d="M 24 7 A 17 17 0 0 1 41 24" opacity="0.3" strokeDasharray="3 3" />
        </svg>
      );

    /* ── 遥感原理：卫星 + 向地面发散的扫描锥 ── */
    case 'remote-sensing':
      return (
        <svg {...common}>
          <rect x="18" y="7" width="12" height="8" opacity="0.7" />
          <rect x="6" y="8.5" width="9" height="5" opacity="0.45" />
          <rect x="33" y="8.5" width="9" height="5" opacity="0.45" />
          <line x1="15" y1="11" x2="18" y2="11" opacity="0.5" />
          <line x1="30" y1="11" x2="33" y2="11" opacity="0.5" />
          <line x1="22" y1="15" x2="14" y2="33" opacity="0.5" />
          <line x1="26" y1="15" x2="34" y2="33" opacity="0.5" />
          <line x1="24" y1="15" x2="24" y2="34" opacity="0.3" strokeDasharray="2.5 2.5" />
          <path d="M 8 38 Q 16 35 24 38 T 40 38" opacity="0.4" />
          <circle cx="24" cy="11" r="1.8" fill="currentColor" stroke="none" opacity="0.85" />
        </svg>
      );

    /* ── 回归分析：散点 + 回归直线 + 虚线置信带 ── */
    case 'regression':
      return (
        <svg {...common}>
          <line x1="7" y1="39" x2="42" y2="11" opacity="0.8" />
          <line x1="7" y1="34" x2="42" y2="6" opacity="0.3" strokeDasharray="3 3" />
          <line x1="7" y1="44" x2="42" y2="16" opacity="0.3" strokeDasharray="3 3" />
          <circle cx="11" cy="37" r="1.8" fill="currentColor" stroke="none" opacity="0.7" />
          <circle cx="17" cy="31" r="1.8" fill="currentColor" stroke="none" opacity="0.75" />
          <circle cx="23" cy="34" r="1.8" fill="currentColor" stroke="none" opacity="0.7" />
          <circle cx="29" cy="24" r="1.8" fill="currentColor" stroke="none" opacity="0.8" />
          <circle cx="35" cy="20" r="1.8" fill="currentColor" stroke="none" opacity="0.75" />
          <circle cx="40" cy="13" r="1.8" fill="currentColor" stroke="none" opacity="0.7" />
        </svg>
      );

    /* ── 宇宙化学：锥形烧瓶 + 瓶上方原子轨道 ── */
    case 'cosmochemistry':
      return (
        <svg {...common}>
          <ellipse cx="24" cy="8.5" rx="13" ry="4" transform="rotate(-12 24 8.5)" opacity="0.45" />
          <circle cx="35.5" cy="6" r="1.6" fill="currentColor" stroke="none" opacity="0.85" />
          <circle cx="24" cy="8.5" r="1.2" fill="currentColor" stroke="none" opacity="0.6" />
          <path
            d="M 20 15 L 20 22 L 11 39 Q 10 43 14 43 L 34 43 Q 38 43 37 39 L 28 22 L 28 15"
            opacity="0.65"
          />
          <line x1="17" y1="15" x2="31" y2="15" opacity="0.55" />
          <line x1="16" y1="33" x2="32" y2="33" opacity="0.35" />
          <circle cx="24" cy="38" r="1.5" fill="currentColor" stroke="none" opacity="0.6" />
        </svg>
      );

    /* ── 地球物理：波浪地层线 + 震源放射半圆波 ── */
    case 'geophysics':
      return (
        <svg {...common}>
          <path d="M 4 30 Q 12 25 20 30 T 36 30 T 44 28" opacity="0.55" />
          <path d="M 4 37 Q 12 32 20 37 T 36 37 T 44 35" opacity="0.4" />
          <path d="M 4 44 Q 12 39 20 44 T 36 44 T 44 42" opacity="0.28" />
          <path d="M 19 17 A 5 5 0 0 0 29 17" opacity="0.6" />
          <path d="M 14 17 A 10 10 0 0 0 34 17" opacity="0.35" />
          <path d="M 9 17 A 15 15 0 0 0 39 17" opacity="0.2" />
          <circle cx="24" cy="14" r="2" fill="currentColor" stroke="none" opacity="0.85" />
        </svg>
      );

    /* ── 默认：圆 + 轨道 ── */
    default:
      return (
        <svg {...common}>
          <circle cx="24" cy="24" r="8" opacity="0.6" />
          <ellipse cx="24" cy="24" rx="17" ry="6.5" transform="rotate(-25 24 24)" opacity="0.4" />
          <circle cx="24" cy="24" r="1.8" fill="currentColor" stroke="none" opacity="0.85" />
          <circle cx="38" cy="16" r="1.6" fill="currentColor" stroke="none" opacity="0.7" />
        </svg>
      );
  }
}
