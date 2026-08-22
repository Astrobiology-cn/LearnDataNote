import { Link } from 'react-router';
import { Wireframe } from '../components/PageHero';

export default function NotFoundPage() {
  return (
    <section className="relative w-full overflow-hidden pt-40 pb-24 md:pt-48 md:pb-32 px-6">
      <Wireframe variant="orbit" />

      <div className="relative z-10 max-w-[1280px] mx-auto text-center">
        <span className="inline-block text-primary text-xl mb-8" aria-hidden="true">✦</span>

        <h1 className="mega-title text-foreground mb-4">404</h1>
        <p className="label-plate mb-8">页面未找到</p>

        <p className="max-w-[520px] mx-auto text-base text-secondary-foreground leading-relaxed mb-12">
          你访问的页面不存在，可能已被移动或删除。
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10">
          <Link to="/" className="btn-copper">
            返回首页
          </Link>
          <Link
            to="/knowledge/"
            className="link-underline text-[13px] font-semibold tracking-[0.15em] uppercase text-secondary-foreground hover:text-foreground transition-colors"
          >
            浏览知识库
          </Link>
        </div>
      </div>
    </section>
  );
}
