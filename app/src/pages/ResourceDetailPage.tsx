import { Link, useParams } from 'react-router';
import { resourcesData } from '../lib/content';
import SpaceIcon from '../components/SpaceIcon';
import type { IconName } from '../components/SpaceIcon';
import { ExternalLink } from 'lucide-react';

const categoryIcons: Record<string, IconName> = {
  databases: 'database',
  tools: 'tools',
  journals: 'journal',
  conferences: 'calendar',
  education: 'education',
};

export default function ResourceDetailPage() {
  const { resourceId } = useParams<{ resourceId: string }>();
  const allItems = resourcesData.flatMap((cat) =>
    cat.items.map((item) => ({ ...item, categoryKey: cat.key, categoryLabel: cat.label })),
  );
  const resource = allItems.find((r) => r.id === resourceId);

  if (!resource) {
    return (
      <div className="max-w-[680px] mx-auto px-6 py-24 text-center">
        <div className="text-primary/20 mb-6 flex justify-center">
          <SpaceIcon name="search" size={56} />
        </div>
        <h1 className="text-xl font-heading font-semibold text-foreground mb-2">未找到该资源</h1>
        <p className="text-sm text-muted-foreground mb-6">资源信息不存在或已被移除</p>
        <Link
          to="/resources/"
          className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          ← 返回资源列表
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[680px] mx-auto px-6 py-16 md:py-24">
      <Link
        to="/resources/"
        className="text-sm text-primary hover:text-primary/80 transition-colors mb-8 inline-block"
      >
        ← 返回资源列表
      </Link>

      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-primary/70">
            <SpaceIcon name={categoryIcons[resource.categoryKey] || 'bookmark'} size={28} />
          </span>
          <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-primary border border-primary/40 px-2.5 py-0.5 rounded">
            {resource.categoryLabel}
          </span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-heading font-semibold text-foreground mb-4 tracking-tight">
          {resource.name}
        </h1>
        <div className="flex items-center gap-3">
          <span className="border border-border/60 text-muted-foreground rounded px-2.5 py-0.5 text-[11px] font-medium tracking-wide">
            {resource.tag}
          </span>
          <span className="border border-border/60 text-muted-foreground rounded px-2.5 py-0.5 text-[11px] font-medium tracking-wide">
            {resource.language}
          </span>
        </div>
      </div>

      <section className="mb-10">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3">
          资源简介
        </h2>
        <p className="text-secondary-foreground leading-relaxed">{resource.description}</p>
      </section>

      <div className="flex flex-wrap gap-3 mb-10">
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-copper"
        >
          访问网站
          <ExternalLink size={14} strokeWidth={2.5} />
        </a>
      </div>

      {(() => {
        const related =
          resourcesData
            .find((c) => c.key === resource.categoryKey)
            ?.items.filter((r) => r.id !== resource.id) || [];
        if (!related.length) return null;
        return (
          <section className="pt-8 border-t border-border/40">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">
              同类资源
            </h2>
            <div className="space-y-2">
              {related.map((r) => (
                <Link
                  key={r.id}
                  to={`/resources/${r.id}/`}
                  className="card-scroll px-5 py-3.5 flex items-center justify-between group"
                >
                  <span className="text-sm text-secondary-foreground group-hover:text-foreground transition-colors">
                    {r.name}
                  </span>
                  <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    查看详情 →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        );
      })()}
    </div>
  );
}
