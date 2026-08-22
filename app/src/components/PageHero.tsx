import type { ReactNode } from 'react';

/* ═══════════════════════════════════════════════════════════════
   PageHero — Sanctuary 子页面首屏
   ✦ 铜橙星标 + 巨型页名 + 两侧铭牌标签 + 细线几何线框
   ═══════════════════════════════════════════════════════════════ */

/** 各页面专属线框几何（低透明度细线 SVG） */
export function Wireframe({ variant }: { variant: 'orbit' | 'poly' | 'grid' | 'radar' | 'globe' }) {
  const common = {
    className: 'wireframe absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(80vw,640px)] h-auto',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1,
    'aria-hidden': true as const,
  };
  switch (variant) {
    case 'orbit':
      return (
        <svg viewBox="0 0 400 400" {...common}>
          <circle cx="200" cy="200" r="150" />
          <ellipse cx="200" cy="200" rx="150" ry="52" />
          <ellipse cx="200" cy="200" rx="150" ry="52" transform="rotate(60 200 200)" />
          <ellipse cx="200" cy="200" rx="150" ry="52" transform="rotate(-60 200 200)" />
          <circle cx="200" cy="200" r="4" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'poly':
      return (
        <svg viewBox="0 0 400 400" {...common}>
          <circle cx="200" cy="200" r="150" />
          <path d="M200 50 L330 125 L330 275 L200 350 L70 275 L70 125 Z" />
          <path d="M200 50 L200 350 M70 125 L330 275 M330 125 L70 275" />
          <path d="M200 125 L265 237 L135 237 Z" />
        </svg>
      );
    case 'grid':
      return (
        <svg viewBox="0 0 400 400" {...common}>
          <circle cx="200" cy="200" r="110" />
          <path d="M60 60 H340 V340 H60 Z" />
          <path d="M60 153 H340 M60 247 H340 M153 60 V340 M247 60 V340" />
          <path d="M60 60 L340 340 M340 60 L60 340" />
        </svg>
      );
    case 'radar':
      return (
        <svg viewBox="0 0 400 400" {...common}>
          <circle cx="200" cy="200" r="150" />
          <circle cx="200" cy="200" r="100" />
          <circle cx="200" cy="200" r="50" />
          <path d="M50 200 H350 M200 50 V350" />
          <path d="M200 200 L320 80" />
        </svg>
      );
    case 'globe':
      return (
        <svg viewBox="0 0 400 400" {...common}>
          <circle cx="200" cy="200" r="150" />
          <ellipse cx="200" cy="200" rx="150" ry="60" />
          <ellipse cx="200" cy="200" rx="150" ry="110" />
          <ellipse cx="200" cy="200" rx="60" ry="150" />
          <ellipse cx="200" cy="200" rx="110" ry="150" />
          <path d="M50 200 H350" />
        </svg>
      );
  }
}

export default function PageHero({
  title,
  titleEn,
  labelLeft,
  labelRight,
  description,
  wireframe = 'orbit',
  children,
}: {
  /** 中文页名（大标题） */
  title: string;
  /** 英文巨型字（可选，替换中文大标题为英文巨标） */
  titleEn?: string;
  labelLeft?: string;
  labelRight?: string;
  description?: string;
  wireframe?: 'orbit' | 'poly' | 'grid' | 'radar' | 'globe';
  children?: ReactNode;
}) {
  return (
    <section className="relative w-full overflow-hidden pt-40 pb-24 md:pt-48 md:pb-32 px-6">
      <Wireframe variant={wireframe} />

      <div className="relative z-10 max-w-[1280px] mx-auto text-center">
        {/* ✦ 铜橙星标 */}
        <span className="inline-block text-primary text-xl mb-8" aria-hidden="true">✦</span>

        {/* 两侧铭牌 */}
        {(labelLeft || labelRight) && (
          <div className="hidden md:flex justify-center items-center gap-16 mb-6">
            <span className="label-plate w-56 text-right">{labelLeft}</span>
            <span className="w-16" />
            <span className="label-plate w-56 text-left">{labelRight}</span>
          </div>
        )}

        {/* 巨型标题 */}
        {titleEn ? (
          <>
            <h1 className="mega-title text-foreground mb-4">{titleEn}</h1>
            <p className="label-plate mb-8">{title}</p>
          </>
        ) : (
          <h1 className="mega-title text-foreground mb-8">{title}</h1>
        )}

        {description && (
          <p className="max-w-[520px] mx-auto text-base md:text-lg text-secondary-foreground leading-relaxed">
            {description}
          </p>
        )}

        {children}
      </div>
    </section>
  );
}
