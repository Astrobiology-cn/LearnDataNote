import { useState, useRef, useEffect, useCallback } from 'react';
import { navItems, scholarsData, resourcesData } from '../lib/content';
import { Link, useLocation, Outlet, useNavigationType } from 'react-router';
import { useTheme } from '../hooks/use-theme';
import { Search, Sun, Moon, Menu, X } from 'lucide-react';
import SharedSpaceBackground from './SharedSpaceBackground';

/* ── Search index ── */
type SearchItem = {
  title: string;
  path: string;
  type: '页面' | '学科' | '学者' | '资源';
  subtitle?: string;
};

const searchIndex: SearchItem[] = [
  ...navItems.flatMap((n) => [
    { title: n.label, path: n.href, type: '页面' as const },
    ...(n.children?.map((c) => ({ title: c.label, path: c.href, type: '学科' as const })) || []),
  ]),
  ...scholarsData.map((s) => ({
    title: s.nameCn || s.name,
    subtitle: s.institutionCn || s.institution,
    path: '/scholars/',
    type: '学者' as const,
  })),
  ...resourcesData.flatMap((cat) =>
    cat.items.map((item) => ({
      title: item.name,
      subtitle: cat.label,
      path: '/resources/',
      type: '资源' as const,
    })),
  ),
];

const HOT_TAGS = ['月球遥感', '火星地质', '宜居带', '陨石学', 'GRAIL', '光谱学'];

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [knowledgeOpen, setKnowledgeOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchItem[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const { theme, toggle: toggleTheme } = useTheme();

  /* ── Close search on route change ── */
  useEffect(() => {
    setSearchOpen(false);
    setQuery('');
    setResults([]);
    setSelectedIdx(-1);
  }, [location.pathname]);

  /* ── Close mobile on route change ── */
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  /* ── 滚动位置纪律（R4 回顶部 + R5 POP 恢复）：
     PUSH/REPLACE（主动跳转）一律回顶部——hash 路由默认保留滚动深度，
     子页面会从半山腰进入；POP（浏览器前进/后退）恢复该路径离开时的位置。
     每个 pathname 的位置随滚动持续存入 sessionStorage ── */
  const navType = useNavigationType();
  useEffect(() => {
    const onScroll = () => {
      try { sessionStorage.setItem(`psh-scroll:${location.pathname}`, String(window.scrollY)); } catch { /* ignore */ }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [location.pathname]);
  useEffect(() => {
    if (navType === 'POP') {
      let saved = 0;
      try { saved = Number(sessionStorage.getItem(`psh-scroll:${location.pathname}`)) || 0; } catch { /* ignore */ }
      if (saved > 0) {
        // 等内容出完一帧再落位，避免被布局后移顶歪
        requestAnimationFrame(() => window.scrollTo({ top: saved, behavior: 'instant' }));
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname, navType]);

  /* ── R5：空闲预热 Hero 3D 场景——任意页面停留时后台加载 PlanetCanvas chunk
     并预载行星纹理（drei 全局缓存），返回首页时 lazy 与 useTexture 同步命中，
     消除「星球延迟一两秒才淡入」的重进延迟 ── */
  useEffect(() => {
    const warm = () => {
      import('./PlanetCanvas').then((m) => m.preloadPlanetAssets());
    };
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(warm, { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }
    const t = window.setTimeout(warm, 2000);
    return () => window.clearTimeout(t);
  }, []);

  /* ── Click outside → close search ── */
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
        setSelectedIdx(-1);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── Focus input on open ── */
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  /* ── Search logic ── */
  const doSearch = useCallback((q: string) => {
    setQuery(q);
    setSelectedIdx(-1);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    const lower = q.toLowerCase();
    setResults(
      searchIndex
        .filter(
          (item) =>
            item.title.toLowerCase().includes(lower) ||
            (item.subtitle && item.subtitle.toLowerCase().includes(lower)),
        )
        .slice(0, 8),
    );
  }, []);

  /* ── Keyboard nav ── */
  function handleKeyDown(e: React.KeyboardEvent) {
    if (!results.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && selectedIdx >= 0) {
      e.preventDefault();
      const r = results[selectedIdx];
      if (r) {
        setSearchOpen(false);
        window.location.hash = r.path.startsWith('/') ? `#${r.path}` : `#/${r.path}`;
      }
    } else if (e.key === 'Escape') {
      setSearchOpen(false);
      setSelectedIdx(-1);
    }
  }

  const navLinkBase =
    'link-underline inline-flex items-center px-3 py-2 text-[13px] font-semibold tracking-[0.15em] uppercase transition-colors leading-none';
  const navLinkInactive =
    'text-secondary-foreground hover:text-foreground';
  const navLinkActive = 'text-primary';

  return (
    <div className="min-h-screen text-foreground font-body">
      {/* 贯穿全页的共享背景层：固定、双模式、CSS 变量取色，置于内容之下 */}
      <SharedSpaceBackground />

      <div className="relative z-10">
      {/* ════════════ Navbar ════════════ */}
      <nav className="sticky top-0 z-50 glass-panel border-b-0">
        <div className="max-w-[1280px] mx-auto px-6 h-[68px] flex items-center">
          {/* Logo */}
          <div className="flex-1 flex justify-start">
            <Link
              to="/"
              className="font-heading flex items-center gap-2.5 text-[15px] font-medium tracking-[0.3em] text-foreground hover:text-primary transition-colors shrink-0"
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="text-primary"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <ellipse cx="12" cy="12" rx="4" ry="10" />
                <path d="M2 12h20" />
              </svg>
              <span className="hidden sm:inline">行星科学</span>
            </Link>
          </div>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-0.5 flex-none">
            {navItems.map((item) =>
              item.children ? (
                <div
                  key={item.label}
                  className="relative flex items-center"
                  onMouseEnter={() => setKnowledgeOpen(true)}
                  onMouseLeave={() => setKnowledgeOpen(false)}
                >
                  <Link
                    to={item.href}
                    className={`${navLinkBase} ${
                      location.pathname.startsWith('/knowledge') ? navLinkActive : navLinkInactive
                    }`}
                  >
                    {item.label}
                  </Link>
                  {knowledgeOpen && (
                    <div className="absolute top-full left-0 mt-1 w-44 glass-panel-raised backdrop-blur-xl rounded-xl py-2 shadow-xl z-50">
                      {item.children.map((c) => (
                        <Link
                          key={c.label}
                          to={c.href}
                          className="block px-4 py-2 text-[14px] text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
                        >
                          {c.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={item.label}
                  to={item.href}
                  className={`${navLinkBase} ${
                    location.pathname === item.href ? navLinkActive : navLinkInactive
                  }`}
                >
                  {item.label}
                </Link>
              ),
            )}
          </div>

          {/* Right actions */}
          <div className="flex-1 flex justify-end items-center gap-1.5">
            <a
              href="https://github.com/Astrobiology-cn/Astrobiology-cn.github.io"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-copper hidden xl:inline-flex !py-2 !px-4 !text-[11px] mr-2"
            >
              GitHub
            </a>
            <button
              onClick={toggleTheme}
              className="h-9 w-9 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              aria-label={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
              title={theme === 'dark' ? '浅色模式' : '深色模式'}
            >
              {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
            </button>

            {/* Search */}
            <div ref={searchRef} className="relative">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className={`h-9 w-9 flex items-center justify-center rounded-lg transition-colors ${
                  searchOpen
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card'
                }`}
                aria-label="搜索"
              >
                <Search size={20} />
              </button>

              {searchOpen && (
                <div className="absolute right-0 top-full mt-2 w-[400px] max-w-[calc(100vw-2rem)] glass-panel-raised backdrop-blur-xl rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40">
                    <Search size={16} className="text-muted-foreground" />
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="搜索知识、学者、资源..."
                      value={query}
                      onChange={(e) => doSearch(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="flex-1 text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                    />
                    {query && (
                      <button onClick={() => doSearch('')} className="text-muted-foreground hover:text-foreground">
                        <X size={14} />
                      </button>
                    )}
                    <kbd className="text-[10px] text-muted-foreground border border-border/60 rounded px-1.5 py-0.5">
                      ESC
                    </kbd>
                  </div>

                  {results.length > 0 ? (
                    <div className="max-h-[340px] overflow-y-auto py-2">
                      {results.map((r, i) => (
                        <Link
                          key={`${r.type}-${r.title}-${i}`}
                          to={r.path}
                          onClick={() => setSearchOpen(false)}
                          className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                            i === selectedIdx ? 'bg-primary/10' : 'hover:bg-card'
                          }`}
                        >
                          <span className="text-[11px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded shrink-0">
                            {r.type}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm text-foreground truncate">{r.title}</p>
                            {r.subtitle && (
                              <p className="text-xs text-muted-foreground truncate">{r.subtitle}</p>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : query.trim() ? (
                    <div className="px-4 py-10 text-center text-sm text-muted-foreground">未找到相关内容</div>
                  ) : (
                    <div className="px-4 py-4">
                      <p className="text-xs text-muted-foreground mb-2.5">热门搜索</p>
                      <div className="flex flex-wrap gap-1.5">
                        {HOT_TAGS.map((tag) => (
                          <button
                            key={tag}
                            onClick={() => doSearch(tag)}
                            className="px-2.5 py-1 text-xs text-muted-foreground bg-card border border-border/60 rounded-full hover:text-primary hover:border-primary/25 transition-colors"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              className="lg:hidden h-9 w-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? '关闭菜单' : '打开菜单'}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-300 ${
            mobileOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="bg-card border-t border-border/40 px-6 py-4 space-y-1">
            <div className="flex items-center gap-3 px-3 py-2 bg-background rounded-lg mb-3 border border-border/60">
              <Search size={16} className="text-muted-foreground" />
              <input
                type="text"
                placeholder="搜索..."
                value={query}
                onChange={(e) => doSearch(e.target.value)}
                className="flex-1 text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
              />
            </div>
            {results.slice(0, 5).map((r, i) => (
              <Link
                key={i}
                to={r.path}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 text-sm text-muted-foreground hover:text-primary rounded-lg"
              >
                <span className="text-xs text-primary mr-2">[{r.type}]</span>
                {r.title}
              </Link>
            ))}
            {navItems.map((item) => (
              <div key={item.label}>
                <Link
                  to={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="block py-2.5 text-sm font-medium text-foreground hover:text-primary"
                >
                  {item.label}
                </Link>
                {item.children && (
                  <div className="pl-4 space-y-0.5 pb-1">
                    {item.children.map((c) => (
                      <Link
                        key={c.label}
                        to={c.href}
                        onClick={() => setMobileOpen(false)}
                        className="block py-1.5 text-sm text-muted-foreground hover:text-primary"
                      >
                        {c.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </nav>

      {/* ════════════ Page Content ════════════ */}
      <main>
        <Outlet />
      </main>

      {/* ════════════ Footer ════════════ */}
      <footer className="border-t border-border/40 bg-card/30">
        <div className="max-w-[1280px] mx-auto px-6 py-14">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div>
              <div
                className="font-heading flex items-center gap-2.5 text-foreground font-semibold mb-3"
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  className="text-primary"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <ellipse cx="12" cy="12" rx="4" ry="10" />
                  <path d="M2 12h20" />
                </svg>
                行星科学知识库
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px]">
                探索宇宙奥秘，共享行星科学学习资源。系统化知识体系，开放的学术平台。
              </p>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
                快速链接
              </h4>
              <div className="space-y-2.5 text-sm">
                {[
                  { label: '学科知识', to: '/knowledge/' },
                  { label: '学者信息', to: '/scholars/' },
                  { label: '外部资源', to: '/resources/' },
                  { label: '关于我们', to: '/about/' },
                ].map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    className="block text-muted-foreground hover:text-primary transition-colors"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
                相关链接
              </h4>
              <div className="space-y-2.5 text-sm">
                <a
                  href="https://github.com/Astrobiology-cn/Astrobiology-cn.github.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-muted-foreground hover:text-primary transition-colors"
                >
                  GitHub 仓库
                </a>
                <a
                  href="https://eyes.nasa.gov"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-muted-foreground hover:text-primary transition-colors"
                >
                  NASA Eyes
                </a>
                <a
                  href="https://solarsystem.nasa.gov"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-muted-foreground hover:text-primary transition-colors"
                >
                  NASA Solar System
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-border/40 mt-10 pt-6 text-center text-xs text-muted-foreground">
            <p>行星科学知识库 · Planetary Science Knowledge Hub</p>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
