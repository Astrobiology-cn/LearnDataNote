import { Link } from 'react-router';

/**
 * OrbitEntry — 环形入口按钮.
 *
 * 56px 圆环：外圈 dashed border 以 12s linear infinite 慢速旋转，中心右箭头。
 * hover：圆环变实线、背景填铜橙（text 变 primary-foreground）、箭头右移。
 * 整体为 react-router Link，下方跟 label-plate 样式标签。
 */

type Props = {
  to: string;
  label: string;
};

export default function OrbitEntry({ to, label }: Props) {
  return (
    <Link to={to} className="group inline-flex flex-col items-center gap-5">
      <style>{`@keyframes orbit-spin { to { transform: rotate(360deg); } }`}</style>
      <span className="relative flex h-14 w-14 items-center justify-center">
        {/* 旋转虚线外圈；hover 时变实线并填铜橙 */}
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full border border-dashed border-primary transition-[border-style,background-color] duration-500 group-hover:border-solid group-hover:bg-primary"
          style={{ animation: 'orbit-spin 12s linear infinite' }}
        />
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="relative text-primary transition-[color,transform] duration-500 group-hover:text-primary-foreground group-hover:translate-x-0.5"
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </span>
      <span className="label-plate transition-colors duration-500 group-hover:text-primary">
        {label}
      </span>
    </Link>
  );
}
