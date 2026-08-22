/* ── Geometric space-themed icons — dark-background visibility ──
   Theory (Albers / Itten): on dark bgs, thin low-opacity strokes disappear —
   the fix is 明暗对比: use higher opacity + slightly thicker strokes so
   the icon reads as a clear L2 anchor, not a faint decoration.

   Opacity scale (dark-bg calibrated):
     decorative / outer rings  →  0.10–0.20
     secondary / mid elements  →  0.35–0.55
     primary   / focal shapes  →  0.75–0.90

   Stroke: 1.5px (up from 1.2) for crisp rendering against #060b14. */

export type IconName =
  | 'orbit' | 'constellation' | 'hex-grid' | 'pulse' | 'globe'
  | 'math' | 'chart' | 'chemistry' | 'planet' | 'geophysics' | 'satellite'
  | 'database' | 'tools' | 'journal' | 'calendar' | 'education'
  | 'rocket' | 'search' | 'bookmark';

interface SpaceIconProps { name: IconName; size?: number; color?: string }

export default function SpaceIcon({ name, size = 72, color = 'currentColor' }: SpaceIconProps) {
  const s = size;
  const sw = 1.5; // thicker stroke for dark-background legibility

  switch (name) {
    /* ── Orbital rings ── */
    case 'orbit':
      return (
        <svg width={s} height={s} viewBox="0 0 72 72" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round">
          <circle cx="36" cy="36" r="3.5" fill={color} stroke="none" opacity="0.85" />
          <ellipse cx="36" cy="36" rx="20" ry="8" transform="rotate(-30 36 36)" opacity="0.45" />
          <ellipse cx="36" cy="36" rx="30" ry="12" transform="rotate(15 36 36)" opacity="0.25" />
          <path d="M 10 36 A 26 26 0 0 1 62 36" opacity="0.55" />
          <circle cx="54" cy="24" r="2.5" fill={color} stroke="none" opacity="0.8" />
        </svg>
      );

    /* ── Constellation ── */
    case 'constellation':
      return (
        <svg width={s} height={s} viewBox="0 0 72 72" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="20" cy="16" r="3.5" fill={color} stroke="none" opacity="0.85" />
          <circle cx="52" cy="14" r="3" fill={color} stroke="none" opacity="0.75" />
          <circle cx="58" cy="46" r="3.5" fill={color} stroke="none" opacity="0.8" />
          <circle cx="36" cy="56" r="2.5" fill={color} stroke="none" opacity="0.7" />
          <circle cx="12" cy="50" r="2.5" fill={color} stroke="none" opacity="0.65" />
          <circle cx="28" cy="30" r="2" fill={color} stroke="none" opacity="0.6" />
          <line x1="20" y1="16" x2="52" y2="14" opacity="0.4" />
          <line x1="52" y1="14" x2="58" y2="46" opacity="0.35" />
          <line x1="58" y1="46" x2="36" y2="56" opacity="0.4" />
          <line x1="36" y1="56" x2="12" y2="50" opacity="0.3" />
          <line x1="20" y1="16" x2="28" y2="30" opacity="0.35" />
          <line x1="28" y1="30" x2="58" y2="46" opacity="0.3" />
        </svg>
      );

    /* ── Hex grid ── */
    case 'hex-grid':
      return (
        <svg width={s} height={s} viewBox="0 0 72 72" fill="none" stroke={color} strokeWidth={sw} strokeLinejoin="round">
          <polygon points="36,22 48,28 48,44 36,50 24,44 24,28" opacity="0.5" />
          <polygon points="36,8 44,12 44,20 36,16 28,20 28,12" opacity="0.25" />
          <polygon points="52,36 56,28 54,20 50,16 48,24 48,36" opacity="0.2" />
          <polygon points="20,36 16,28 18,20 22,16 24,24 24,36" opacity="0.2" />
          <circle cx="36" cy="36" r="3" fill={color} stroke="none" opacity="0.85" />
          <circle cx="36" cy="12" r="2.5" fill={color} stroke="none" opacity="0.65" />
          <circle cx="53" cy="24" r="2.5" fill={color} stroke="none" opacity="0.65" />
          <circle cx="19" cy="24" r="2.5" fill={color} stroke="none" opacity="0.65" />
        </svg>
      );

    /* ── Pulse ── */
    case 'pulse':
      return (
        <svg width={s} height={s} viewBox="0 0 72 72" fill="none" stroke={color} strokeWidth={sw}>
          <circle cx="36" cy="36" r="8" opacity="0.55" />
          <circle cx="36" cy="36" r="18" opacity="0.35" />
          <circle cx="36" cy="36" r="28" opacity="0.18" />
          <circle cx="36" cy="36" r="3.5" fill={color} stroke="none" opacity="0.85" />
          <line x1="36" y1="4" x2="36" y2="16" opacity="0.3" />
          <line x1="36" y1="56" x2="36" y2="68" opacity="0.3" />
          <line x1="4" y1="36" x2="16" y2="36" opacity="0.3" />
          <line x1="56" y1="36" x2="68" y2="36" opacity="0.3" />
        </svg>
      );

    /* ── Globe ── */
    case 'globe':
      return (
        <svg width={s} height={s} viewBox="0 0 72 72" fill="none" stroke={color} strokeWidth={sw}>
          <circle cx="36" cy="36" r="28" opacity="0.5" />
          <ellipse cx="36" cy="36" rx="12" ry="28" opacity="0.4" />
          <line x1="8" y1="36" x2="64" y2="36" opacity="0.35" />
          <ellipse cx="36" cy="36" rx="28" ry="12" opacity="0.22" />
          <ellipse cx="36" cy="36" rx="28" ry="16" opacity="0.28" transform="rotate(-15 36 36)" />
          <circle cx="36" cy="20" r="3" fill={color} stroke="none" opacity="0.8" />
          <circle cx="50" cy="36" r="3" fill={color} stroke="none" opacity="0.75" />
        </svg>
      );

    /* ── Math ── */
    case 'math':
      return (
        <svg width={s} height={s} viewBox="0 0 72 72" fill="none" stroke={color} strokeWidth={sw * 1.1} strokeLinecap="round" strokeLinejoin="round">
          <path d="M 20 52 Q 36 20 52 52" opacity="0.6" />
          <circle cx="36" cy="36" r="24" opacity="0.3" />
          <circle cx="36" cy="36" r="3.5" fill={color} stroke="none" opacity="0.85" />
        </svg>
      );

    /* ── Chart ── */
    case 'chart':
      return (
        <svg width={s} height={s} viewBox="0 0 72 72" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round">
          <rect x="14" y="38" width="10" height="20" rx="2" opacity="0.5" />
          <rect x="31" y="24" width="10" height="34" rx="2" opacity="0.6" />
          <rect x="48" y="16" width="10" height="42" rx="2" opacity="0.7" />
          <circle cx="46" cy="20" r="3" fill={color} stroke="none" opacity="0.85" />
        </svg>
      );

    /* ── Chemistry ── */
    case 'chemistry':
      return (
        <svg width={s} height={s} viewBox="0 0 72 72" fill="none" stroke={color} strokeWidth={sw} strokeLinejoin="round">
          <polygon points="36,14 55,25 55,47 36,58 17,47 17,25" opacity="0.5" />
          <circle cx="36" cy="14" r="3.5" fill={color} stroke="none" opacity="0.85" />
          <circle cx="55" cy="25" r="3" fill={color} stroke="none" opacity="0.75" />
          <circle cx="17" cy="25" r="3" fill={color} stroke="none" opacity="0.75" />
        </svg>
      );

    /* ── Planet ── */
    case 'planet':
      return (
        <svg width={s} height={s} viewBox="0 0 72 72" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round">
          <circle cx="32" cy="34" r="18" opacity="0.6" />
          <ellipse cx="32" cy="34" rx="30" ry="7" transform="rotate(-20 32 34)" opacity="0.45" />
          <circle cx="32" cy="34" r="6" opacity="0.35" />
          <circle cx="26" cy="30" r="2.5" fill={color} stroke="none" opacity="0.7" />
        </svg>
      );

    /* ── Geophysics ── */
    case 'geophysics':
      return (
        <svg width={s} height={s} viewBox="0 0 72 72" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="36" cy="30" r="20" opacity="0.45" />
          <circle cx="36" cy="30" r="13" opacity="0.35" />
          <circle cx="36" cy="30" r="6" opacity="0.4" />
          <path d="M 10 52 Q 20 42 30 52 T 50 52 T 62 48" opacity="0.5" />
          <circle cx="36" cy="52" r="3" fill={color} stroke="none" opacity="0.75" />
        </svg>
      );

    /* ── Satellite ── */
    case 'satellite':
      return (
        <svg width={s} height={s} viewBox="0 0 72 72" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <rect x="26" y="22" width="20" height="28" rx="4" opacity="0.55" />
          <line x1="36" y1="12" x2="36" y2="22" opacity="0.45" />
          <line x1="18" y1="36" x2="54" y2="36" opacity="0.3" />
          <path d="M 14 50 Q 36 56 58 48" opacity="0.22" />
          <circle cx="36" cy="16" r="3" fill={color} stroke="none" opacity="0.85" />
        </svg>
      );

    /* ── Database ── */
    case 'database':
      return (
        <svg width={s} height={s} viewBox="0 0 72 72" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round">
          <ellipse cx="36" cy="20" rx="22" ry="7" opacity="0.5" />
          <path d="M 14 20 L 14 52" opacity="0.45" />
          <path d="M 58 20 L 58 52" opacity="0.45" />
          <ellipse cx="36" cy="36" rx="22" ry="7" opacity="0.35" />
          <ellipse cx="36" cy="52" rx="22" ry="7" opacity="0.5" />
          <circle cx="36" cy="20" r="3" fill={color} stroke="none" opacity="0.8" />
        </svg>
      );

    /* ── Tools ── */
    case 'tools':
      return (
        <svg width={s} height={s} viewBox="0 0 72 72" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="36" cy="36" r="18" opacity="0.3" strokeDasharray="4 3" />
          <circle cx="36" cy="36" r="8" opacity="0.55" />
          <line x1="42" y1="42" x2="58" y2="58" opacity="0.65" strokeWidth={sw * 1.3} />
          <circle cx="36" cy="36" r="3" fill={color} stroke="none" opacity="0.85" />
        </svg>
      );

    /* ── Journal ── */
    case 'journal':
      return (
        <svg width={s} height={s} viewBox="0 0 72 72" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <rect x="16" y="12" width="28" height="48" rx="3" opacity="0.55" />
          <line x1="22" y1="24" x2="38" y2="24" opacity="0.45" />
          <line x1="22" y1="32" x2="38" y2="32" opacity="0.4" />
          <line x1="22" y1="40" x2="34" y2="40" opacity="0.35" />
          <rect x="30" y="18" width="28" height="42" rx="3" opacity="0.28" />
          <circle cx="24" cy="24" r="2.5" fill={color} stroke="none" opacity="0.75" />
        </svg>
      );

    /* ── Calendar ── */
    case 'calendar':
      return (
        <svg width={s} height={s} viewBox="0 0 72 72" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <rect x="12" y="14" width="48" height="48" rx="5" opacity="0.5" />
          <line x1="12" y1="26" x2="60" y2="26" opacity="0.45" />
          <line x1="22" y1="8" x2="22" y2="20" opacity="0.5" />
          <line x1="50" y1="8" x2="50" y2="20" opacity="0.5" />
          <rect x="18" y="32" width="16" height="10" rx="2" opacity="0.35" />
          <rect x="38" y="32" width="16" height="10" rx="2" opacity="0.28" />
          <circle cx="28" cy="46" r="2.5" fill={color} stroke="none" opacity="0.7" />
        </svg>
      );

    /* ── Education ── */
    case 'education':
      return (
        <svg width={s} height={s} viewBox="0 0 72 72" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <path d="M 14 48 L 36 36 L 58 48 L 36 60 Z" opacity="0.55" />
          <path d="M 14 48 L 14 56 Q 14 60 20 58 L 36 50" opacity="0.35" />
          <line x1="36" y1="36" x2="36" y2="60" opacity="0.4" />
          <circle cx="36" cy="36" r="3" fill={color} stroke="none" opacity="0.85" />
        </svg>
      );

    /* ── Rocket ── */
    case 'rocket':
      return (
        <svg width={s} height={s} viewBox="0 0 72 72" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <path d="M 36 8 L 24 38 L 36 48 L 48 38 Z" opacity="0.55" />
          <path d="M 24 38 Q 18 50 12 54" opacity="0.4" />
          <path d="M 48 38 Q 54 50 60 54" opacity="0.4" />
          <circle cx="36" cy="28" r="4" opacity="0.45" />
          <circle cx="36" cy="58" r="3" fill={color} stroke="none" opacity="0.7" />
        </svg>
      );

    /* ── Search ── */
    case 'search':
      return (
        <svg width={s} height={s} viewBox="0 0 72 72" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round">
          <circle cx="30" cy="30" r="18" opacity="0.55" />
          <line x1="44" y1="44" x2="62" y2="62" opacity="0.6" strokeWidth={sw * 1.3} />
          <circle cx="30" cy="30" r="3" fill={color} stroke="none" opacity="0.8" />
        </svg>
      );

    /* ── Bookmark ── */
    case 'bookmark':
      return (
        <svg width={s} height={s} viewBox="0 0 72 72" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
          <line x1="36" y1="10" x2="36" y2="62" opacity="0.45" />
          <polygon points="36,10 58,18 36,26" opacity="0.55" />
          <circle cx="36" cy="10" r="2.5" fill={color} stroke="none" opacity="0.8" />
        </svg>
      );

    default:
      return null;
  }
}
