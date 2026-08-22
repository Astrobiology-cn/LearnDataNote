import { Link, useParams } from 'react-router';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { getNewsById } from '../lib/content';
import type { News } from '../lib/content';

const categoryMeta: Record<News['category'], { label: string; href: string }> = {
  knowledge: { label: '学科知识', href: '/knowledge/' },
  scholars: { label: '学者信息', href: '/scholars/' },
  resources: { label: '外部资源', href: '/resources/' },
};

export default function NewsDetailPage() {
  const { id } = useParams<{ id: string }>();
  const news = getNewsById(id || '');

  if (!news) {
    return (
      <div className="max-w-[680px] mx-auto px-6 py-24 text-center">
        <div className="text-6xl mb-6 flex justify-center text-primary/15">✦</div>
        <h1 className="text-xl font-heading font-semibold text-foreground mb-2">未找到该新闻</h1>
        <p className="text-sm text-muted-foreground mb-6">新闻不存在或已被移除</p>
        <Link
          to="/"
          className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          ← 返回首页
        </Link>
      </div>
    );
  }

  const meta = categoryMeta[news.category];
  /* 仅把正文（不含 frontmatter）交给 MarkdownRenderer，经 data: URL 走其既有的 fetch 流程 */
  const mdUrl = `data:text/markdown;charset=utf-8,${encodeURIComponent(news.content)}`;

  return (
    <div className="max-w-[680px] mx-auto px-6 py-16 md:py-24">
      <Link
        to={meta.href}
        className="link-underline text-[13px] font-semibold tracking-[0.15em] uppercase text-secondary-foreground hover:text-foreground transition-colors mb-12 inline-block"
      >
        ← 返回{meta.label}
      </Link>

      {/* Header — PageHero 风格：✦ 铜橙星标 + font-heading 大标题 + label-plate 元信息 */}
      <header className="mb-12">
        <span className="inline-block text-primary text-lg mb-6" aria-hidden="true">✦</span>
        <h1 className="text-3xl lg:text-5xl font-heading font-semibold text-foreground mb-4 tracking-tight leading-[1.15]">
          {news.title}
        </h1>
        <p className="label-plate">
          {news.date} · {meta.label}
        </p>
      </header>

      {/* 摘要引子 */}
      <div className="card-space border-l-2 border-l-primary p-6 mb-10">
        <p className="label-plate !text-primary mb-3">摘要</p>
        <p className="text-sm text-foreground leading-relaxed">{news.summary}</p>
      </div>

      {/* 正文 */}
      <MarkdownRenderer url={mdUrl} />

      {/* 返回链接 */}
      <div className="mt-14 pt-6 border-t border-border/40">
        <Link
          to={meta.href}
          className="link-underline text-[13px] font-semibold tracking-[0.15em] uppercase text-primary"
        >
          ← 返回{meta.label}
        </Link>
      </div>
    </div>
  );
}
