import { useState, useMemo } from 'react';
import { Link } from 'react-router';
import { scholarsData } from '../lib/content';
import type { Scholar } from '../lib/content';
import SpaceIcon from '../components/SpaceIcon';
import PageHero from '../components/PageHero';
import NewsCarousel from '../components/NewsCarousel';
import { useScrollReveal } from '../animations/useScrollReveal';

function countryLabel(c: string) {
  const map: Record<string, string> = { USA: '美国', China: '中国', France: '法国' };
  return map[c] || c;
}

const allCountries = [...new Set(scholarsData.map((s) => s.country))];
const allFields = [...new Set(scholarsData.flatMap((s) => s.fields))];

/* Country sections, in display order; any other countries are appended below */
const countrySections: { key: string; label: string }[] = [
  { key: 'USA', label: '国外学者' },
  { key: 'China', label: '国内学者' },
  { key: 'France', label: '法国' },
];
const orderedCountries = [
  ...countrySections,
  ...allCountries
    .filter((c) => !countrySections.some((s) => s.key === c))
    .map((c) => ({ key: c, label: countryLabel(c) })),
];

/* ── Big card for featured scholars ── */
function FeaturedCard({ scholar: s }: { scholar: Scholar }) {
  return (
    <Link
      to={`/scholars/${s.id}/`}
      className="card-space p-8 flex flex-col gap-5 group min-h-[280px]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-heading font-semibold text-foreground group-hover:text-primary transition-colors">
            {s.nameCn || s.name}
          </h3>
          {s.nameCn && s.nameCn !== s.name && (
            <p className="text-sm text-muted-foreground italic mt-0.5">{s.name}</p>
          )}
          <p className="text-sm text-secondary-foreground mt-2">{s.institutionCn || s.institution}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          <span className="text-primary text-sm" aria-hidden="true">✦</span>
          <span className="text-xs text-muted-foreground border border-border rounded px-2 py-0.5 whitespace-nowrap">
            {countryLabel(s.country)}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {s.fields.map((f) => (
          <span
            key={f}
            className="border border-border text-muted-foreground rounded px-2 py-0.5 text-xs"
          >
            {f}
          </span>
        ))}
      </div>
      <p className="text-sm text-muted-foreground flex-1 leading-relaxed line-clamp-4">{s.bio}</p>
      <div className="text-xs text-secondary-foreground bg-secondary px-3 py-1.5 rounded font-medium">
        {s.highlight}
      </div>
      <span className="text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
        查看详情 →
      </span>
    </Link>
  );
}

/* ── Regular grid card ── */
function ScholarCard({ scholar: s }: { scholar: Scholar }) {
  return (
    <Link to={`/scholars/${s.id}/`} className="card-space p-6 flex flex-col gap-4 group">
      <div>
        <h3 className="font-heading font-semibold text-foreground truncate group-hover:text-primary transition-colors">
          {s.nameCn || s.name}
        </h3>
        {s.nameCn && s.nameCn !== s.name && (
          <p className="text-xs text-muted-foreground italic mt-0.5">{s.name}</p>
        )}
        <p className="text-sm text-secondary-foreground truncate mt-1">{s.institutionCn || s.institution}</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {s.fields.map((f) => (
          <span
            key={f}
            className="border border-border text-muted-foreground rounded px-2 py-0.5 text-xs"
          >
            {f}
          </span>
        ))}
      </div>
      <p className="text-sm text-muted-foreground flex-1 leading-relaxed line-clamp-3">{s.bio}</p>
      <div className="text-xs text-secondary-foreground bg-secondary px-3 py-1.5 rounded font-medium">
        {s.highlight}
      </div>
      <span className="text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
        查看详情 →
      </span>
    </Link>
  );
}

/* ── List (table) view for one section ── */
function ScholarTable({ items }: { items: Scholar[] }) {
  return (
    <div className="overflow-x-auto rounded border border-border">
      <table className="w-full border-collapse table-fixed" style={{ minWidth: '860px' }}>
        <colgroup>
          <col style={{ width: '20%' }} />
          <col style={{ width: '24%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '26%' }} />
          <col style={{ width: '13%' }} />
          <col style={{ width: '7%' }} />
        </colgroup>
        <thead>
          <tr className="bg-card/80">
            {['姓名', '机构', '国家', '研究方向', '代表作', '链接'].map((h) => (
              <th
                key={h}
                className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((s) => (
            <tr key={s.id} className="border-t border-border/40 hover:bg-card/50 transition-colors">
              <td className="px-4 py-3">
                <Link to={`/scholars/${s.id}/`} className="group">
                  <div className="font-heading font-semibold text-foreground text-sm truncate group-hover:text-primary transition-colors">
                    {s.nameCn || s.name}
                  </div>
                  {s.nameCn && s.nameCn !== s.name && (
                    <div className="text-xs text-muted-foreground italic truncate">{s.name}</div>
                  )}
                </Link>
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground truncate">
                {s.institutionCn || s.institution}
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                {countryLabel(s.country)}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {s.fields.map((f) => (
                    <span
                      key={f}
                      className="border border-border text-muted-foreground rounded px-2 py-0.5 text-xs whitespace-nowrap"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-secondary-foreground truncate">{s.highlight}</td>
              <td className="px-4 py-3">
                <Link
                  to={`/scholars/${s.id}/`}
                  className="text-sm text-primary hover:text-primary/80 transition-colors whitespace-nowrap"
                >
                  详情 →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── One country section with its own grid/list content ── */
function CountrySection({
  label,
  countryKey,
  items,
  viewMode,
}: {
  label: string;
  countryKey: string;
  items: Scholar[];
  viewMode: 'grid' | 'list';
}) {
  const sectionRef = useScrollReveal<HTMLDivElement>({ from: 'bottom', duration: 0.7 });

  return (
    <div ref={sectionRef} className="mb-12">
      <div className="flex items-center gap-4 mb-5">
        <h2 className="text-xl font-heading font-semibold text-foreground">{label}</h2>
        <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
          {countryKey}
        </span>
        <div className="flex-1 h-px bg-border/40" />
        <span className="text-xs text-muted-foreground font-mono">{items.length} 位学者</span>
      </div>
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((s) => (
            <ScholarCard key={s.id} scholar={s} />
          ))}
        </div>
      ) : (
        <ScholarTable items={items} />
      )}
    </div>
  );
}

export default function ScholarsPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    const saved = localStorage.getItem('psh-scholar-view');
    return saved === 'list' || saved === 'grid' ? saved : 'grid';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCountry, setFilterCountry] = useState('all');
  const [filterField, setFilterField] = useState('all');

  const featuredRef = useScrollReveal<HTMLDivElement>({ from: 'bottom', duration: 0.7, delay: 0.1 });
  const controlsRef = useScrollReveal<HTMLDivElement>({ from: 'bottom', duration: 0.7, delay: 0.1 });

  function setView(mode: 'list' | 'grid') {
    setViewMode(mode);
    localStorage.setItem('psh-scholar-view', mode);
  }

  const filtered = useMemo(() => {
    return scholarsData.filter((s) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        (s.nameCn || s.name).toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.institution.toLowerCase().includes(q) ||
        s.fields.some((f) => f.toLowerCase().includes(q));
      return (
        matchSearch &&
        (filterCountry === 'all' || s.country === filterCountry) &&
        (filterField === 'all' || s.fields.includes(filterField))
      );
    });
  }, [searchQuery, filterCountry, filterField]);

  const featured = filtered.filter((s) => s.featured).slice(0, 4);

  const sections = orderedCountries
    .map((c) => ({ ...c, items: filtered.filter((s) => s.country === c.key) }))
    .filter((c) => c.items.length > 0);

  const activeFilters = [filterCountry, filterField].filter((f) => f !== 'all').length;
  function clearFilters() {
    setFilterCountry('all');
    setFilterField('all');
    setSearchQuery('');
  }

  const inputClass =
    'w-full pl-11 pr-10 py-2.5 bg-card border border-border rounded text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-all';
  const selectClass =
    'appearance-none pl-3 pr-8 py-1.5 bg-card border border-border rounded text-[13px] text-foreground outline-none focus:border-primary cursor-pointer';

  return (
    <>
      <PageHero
        title="学者信息"
        titleEn="SCHOLARS"
        labelLeft="MULTI-TALENTED"
        labelRight="EXPERTS"
        description="汇集行星科学领域的国内外知名学者与研究机构"
        wireframe="globe"
      />

      <div className="max-w-[1280px] mx-auto px-6 mb-24">
        <NewsCarousel category="scholars" />
      </div>

      <div className="max-w-[1280px] mx-auto px-6 pb-24 md:pb-32">
      {/* Featured scholars */}
      {featured.length > 0 && (
        <div ref={featuredRef} className="mb-16">
          <p className="label-plate mb-6 text-center">
            <span className="text-primary" aria-hidden="true">✦</span> Featured 学者
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featured.map((s) => (
              <FeaturedCard key={s.id} scholar={s} />
            ))}
          </div>
        </div>
      )}

      {/* Search + Filters */}
      <div ref={controlsRef}>
        <div className="mb-6 space-y-3">
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.5"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="搜索学者姓名、机构、研究方向..."
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
          <div className="flex items-center gap-2 flex-wrap">
            <select value={filterCountry} onChange={(e) => setFilterCountry(e.target.value)} className={selectClass}>
              <option value="all">全部国家</option>
              {allCountries.map((c) => (
                <option key={c} value={c}>
                  {countryLabel(c)}
                </option>
              ))}
            </select>
            <select value={filterField} onChange={(e) => setFilterField(e.target.value)} className={selectClass}>
              <option value="all">全部领域</option>
              {allFields.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            {activeFilters > 0 && (
              <button onClick={clearFilters} className="text-sm text-primary hover:text-primary/80 transition-colors">
                清除筛选 ({activeFilters})
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <div className="flex bg-card border border-border rounded p-0.5 gap-0.5">
                <button
                  onClick={() => setView('list')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                    viewMode === 'list'
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                  </svg>
                </button>
                <button
                  onClick={() => setView('grid')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                    viewMode === 'grid'
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="text-sm text-muted-foreground mb-5">共 {filtered.length} 位学者</div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="text-primary/20 mb-5 flex justify-center">
              <SpaceIcon name="search" size={56} />
            </div>
            <p className="text-sm text-muted-foreground mb-4">没有找到符合条件的学者</p>
            <button onClick={clearFilters} className="text-sm text-primary hover:text-primary/80 transition-colors">
              清除所有筛选条件
            </button>
          </div>
        )}

        {/* Country sections */}
        {sections.map((sec) => (
          <CountrySection
            key={sec.key}
            label={sec.label}
            countryKey={sec.key}
            items={sec.items}
            viewMode={viewMode}
          />
        ))}
      </div>
      </div>
    </>
  );
}
