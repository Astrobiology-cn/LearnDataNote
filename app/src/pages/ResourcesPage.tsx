import { useState, useMemo } from 'react';
import { Link } from 'react-router';
import { resourcesData } from '../lib/content';
import SpaceIcon from '../components/SpaceIcon';
import PageHero from '../components/PageHero';
import NewsCarousel from '../components/NewsCarousel';
import { useScrollReveal } from '../animations/useScrollReveal';
import type { IconName } from '../components/SpaceIcon';

const categoryIcons: Record<string, IconName> = {
  databases: 'database',
  tools: 'tools',
  journals: 'journal',
  conferences: 'calendar',
  education: 'education',
};

const allTags = [...new Set(resourcesData.flatMap((cat) => cat.items.map((item) => item.tag)))];

// Featured 资源（最多 6 个）
const featuredResources = resourcesData
  .flatMap((cat) => cat.items.map((item) => ({ ...item, categoryKey: cat.key, categoryLabel: cat.label })))
  .filter((item) => item.featured)
  .slice(0, 6);

export default function ResourcesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState('all');
  const featuredRef = useScrollReveal<HTMLDivElement>({ from: 'bottom', duration: 0.7, delay: 0.1 });
  const contentRef = useScrollReveal<HTMLDivElement>({ from: 'bottom', duration: 0.7, delay: 0.15 });

  const matches = (item: { name: string; description: string; tag: string }) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q || item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
    const matchTag = filterTag === 'all' || item.tag === filterTag;
    return matchSearch && matchTag;
  };

  const visibleFeatured = useMemo(
    () => featuredResources.filter(matches),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchQuery, filterTag],
  );

  const visibleCategories = useMemo(() => {
    return resourcesData
      .map((cat) => ({
        ...cat,
        visibleItems: cat.items.filter(matches),
      }))
      .filter((cat) => cat.visibleItems.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, filterTag]);

  const totalVisible =
    visibleCategories.reduce((sum, cat) => sum + cat.visibleItems.length, 0);

  function clearFilters() {
    setSearchQuery('');
    setFilterTag('all');
  }

  const inputClass =
    'w-full pl-11 pr-10 py-2.5 bg-card border border-border/60 rounded text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-all';

  return (
    <>
      <PageHero
        title="外部资源"
        titleEn="RESOURCES"
        wireframe="radar"
        labelLeft="CURATED"
        labelRight="OPEN ACCESS"
        description="精选行星科学相关数据库、工具、期刊与网站"
      />

      <div className="max-w-[1280px] mx-auto px-6 mb-24">
        <NewsCarousel category="resources" />
      </div>

      <div className="max-w-[1280px] mx-auto px-6 pb-24 md:pb-32">

      {/* Search + Tag filter */}
      <div className="mb-8 space-y-3">
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="搜索资源名称、描述..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={inputClass}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* 标签云 */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setFilterTag(filterTag === tag ? 'all' : tag)}
              className={`px-3 py-1.5 rounded text-[11px] font-medium tracking-[0.08em] transition-all border ${
                filterTag === tag
                  ? 'text-primary border-primary/50'
                  : 'text-muted-foreground border-border/60 hover:border-primary/40 hover:text-foreground'
              }`}
            >
              {tag}
            </button>
          ))}
          {(filterTag !== 'all' || searchQuery) && (
            <button
              onClick={clearFilters}
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              清除筛选
            </button>
          )}
        </div>
      </div>

      {/* Featured 资源 */}
      {visibleFeatured.length > 0 && (
        <div ref={featuredRef} className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-primary">
              <SpaceIcon name="planet" size={22} />
            </span>
            <h2 className="text-xl font-heading font-semibold text-foreground">精选资源</h2>
            <span className="text-xs text-muted-foreground font-mono">{visibleFeatured.length} 项</span>
            <div className="flex-1 h-px bg-border/60" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {visibleFeatured.map((item) => (
              <Link
                key={`featured-${item.id}`}
                to={`/resources/${item.id}/`}
                className="card-scroll p-7 flex flex-col gap-4 group"
              >
                <div className="flex justify-between items-start gap-3">
                  <span className="text-primary/80">
                    <SpaceIcon name={categoryIcons[item.categoryKey] || 'bookmark'} size={28} />
                  </span>
                  <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-primary border border-primary/40 px-2.5 py-1 rounded shrink-0">
                    {item.categoryLabel}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-heading font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
                    {item.name}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                    {item.description}
                  </p>
                </div>
                <div className="flex justify-between items-center pt-3 mt-auto border-t border-border/40">
                  <div className="flex items-center gap-2">
                    <span className="border border-border/60 text-muted-foreground rounded px-2.5 py-0.5 text-[11px] font-medium tracking-wide">
                      {item.tag}
                    </span>
                    <span className="border border-border/60 text-muted-foreground rounded px-2.5 py-0.5 text-[11px] font-medium tracking-wide">
                      {item.language}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    查看详情 →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div ref={contentRef}>
        <div className="text-sm text-muted-foreground mb-5">共 {totalVisible} 个资源</div>

        {totalVisible === 0 && (
          <div className="text-center py-20">
            <div className="text-primary/20 mb-5 flex justify-center">
              <SpaceIcon name="search" size={56} />
            </div>
            <p className="text-sm text-muted-foreground mb-4">没有找到符合条件的资源</p>
            <button
              onClick={clearFilters}
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              清除所有筛选条件
            </button>
          </div>
        )}

        {visibleCategories.length > 0 && (
          <div className="space-y-12">
            {visibleCategories.map((cat) => (
              <section key={cat.key}>
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-primary">
                    <SpaceIcon name={categoryIcons[cat.key] || 'bookmark'} size={22} />
                  </span>
                  <h2 className="text-xl font-heading font-semibold text-foreground">{cat.label}</h2>
                  <span className="text-xs text-muted-foreground font-mono">{cat.visibleItems.length} 项</span>
                  <div className="flex-1 h-px bg-border/60" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cat.visibleItems.map((item) => (
                    <Link
                      key={`${cat.key}-${item.id}`}
                      to={`/resources/${item.id}/`}
                      className="card-scroll p-6 flex flex-col gap-3 group"
                    >
                      <div className="flex justify-between items-start gap-3">
                        <h3 className="text-[15px] font-heading font-semibold text-foreground group-hover:text-primary transition-colors">
                          {item.name}
                        </h3>
                        <span className="border border-border/60 text-muted-foreground rounded px-2.5 py-0.5 text-[11px] font-medium tracking-wide shrink-0">
                          {item.tag}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground flex-1 leading-relaxed line-clamp-2">
                        {item.description}
                      </p>
                      <div className="flex justify-between items-center pt-2 border-t border-border/40">
                        <span className="border border-border/60 text-muted-foreground rounded px-2.5 py-0.5 text-[11px] font-medium tracking-wide">
                          {item.language}
                        </span>
                        <span className="text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                          查看详情 →
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
      </div>
    </>
  );
}
