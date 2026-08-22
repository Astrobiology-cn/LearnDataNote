import { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { getSubjectById, getChaptersBySubject, knowledgeSubjects, knowledgeChapters } from '../lib/content';
import Fuse from 'fuse.js';
import { useScrollReveal } from '../animations/useScrollReveal';
import {
  ChevronLeft,
  ChevronRight,
  Printer,
  Minus,
  Plus,
  AlignJustify,
  Search,
  PanelLeft,
} from 'lucide-react';

const FONT_SIZES = [
  { label: '小', value: 14 },
  { label: '标准', value: 16 },
  { label: '大', value: 18 },
  { label: '特大', value: 20 },
];

const LINE_HEIGHTS = [
  { label: '紧凑', value: 1.5 },
  { label: '标准', value: 1.7 },
  { label: '宽松', value: 1.9 },
  { label: '超宽', value: 2.1 },
];

export default function KnowledgeContentPage() {
  const { subjectId, chapterId } = useParams<{ subjectId: string; chapterId?: string }>();
  const navigate = useNavigate();
  const subject = getSubjectById(subjectId || '');
  // useMemo 固定引用：getChaptersBySubject 每次渲染返回新数组，会让下游
  // fuse useMemo 与搜索 useEffect 每轮都重跑（setSearchResults([]) 新引用）——
  // 渲染→effect→setState→渲染 死循环（Maximum update depth exceeded，页面白屏）
  const chapters = useMemo(() => (subject ? getChaptersBySubject(subject.id) : []), [subject]);
  // R5：活动章节由 URL 驱动（/knowledge/:subjectId/:chapterId?），可深链可分享；
  // chapterId 缺失或非法时兜底第一章，绝不 404
  const activeChapter = chapters.find((c) => c.id === chapterId) || chapters[0];
  // 非法 chapterId 兜底第一章后把 URL 规范化（replace，不留假地址）
  useEffect(() => {
    if (subject && chapterId && activeChapter && chapterId !== activeChapter.id) {
      navigate(`/knowledge/${subject.id}/${activeChapter.id}/`, { replace: true });
    }
  }, [subject, chapterId, activeChapter, navigate]);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [fontSize, setFontSize] = useState(16);
  const [lineHeight, setLineHeight] = useState(1.7);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<'subject' | 'all'>('subject');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ chapter: typeof chapters[0]; matches: string[] }>>([]);
  const contentRef = useRef<HTMLDivElement>(null);
  const headerRef = useScrollReveal<HTMLDivElement>({ from: 'fade', duration: 0.7 });

  // 切换章节 = 路由跳转（深链同步，Layout 负责滚回顶部）
  function goToChapter(id: string) {
    if (!subject) return;
    navigate(`/knowledge/${subject.id}/${id}/`);
  }

  // Fuse.js search
  const fuse = useMemo(() => {
    const searchData = searchScope === 'subject'
      ? chapters.map((c) => ({ ...c, subjectTitle: subject?.title || '' }))
      : knowledgeChapters.map((c) => {
          const sub = knowledgeSubjects.find((s) => s.id === c.subjectId);
          return { ...c, subjectTitle: sub?.title || '' };
        });
    return new Fuse(searchData, {
      keys: ['title', 'content', 'subjectTitle'],
      threshold: 0.3,
      ignoreLocation: true,
    });
  }, [chapters, searchScope, subject]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const results = fuse.search(searchQuery);
    const grouped = new Map<string, { chapter: typeof chapters[0]; matches: string[] }>();
    results.slice(0, 10).forEach((r) => {
      const key = r.item.id;
      if (!grouped.has(key)) {
        grouped.set(key, { chapter: r.item as any, matches: [r.item.title] });
      }
    });
    setSearchResults(Array.from(grouped.values()));
  }, [searchQuery, fuse]);

  // Apply font size and line height
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.style.fontSize = `${fontSize}px`;
      contentRef.current.style.lineHeight = String(lineHeight);
    }
  }, [fontSize, lineHeight]);

  function handlePrint() {
    window.print();
  }

  if (!subject) {
    return (
      <div className="max-w-[680px] mx-auto px-6 py-24 text-center">
        <div className="text-6xl mb-6 flex justify-center text-primary/15">📚</div>
        <h1 className="text-2xl font-heading font-semibold text-foreground mb-2">未找到该学科</h1>
        <p className="text-sm text-muted-foreground mb-6">该学科内容正在建设中</p>
        <Link
          to="/knowledge/"
          className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          返回学科列表 →
        </Link>
      </div>
    );
  }

  const idx = knowledgeSubjects.findIndex((s) => s.id === subject.id);
  const prev = idx > 0 ? knowledgeSubjects[idx - 1] : null;
  const next = idx < knowledgeSubjects.length - 1 ? knowledgeSubjects[idx + 1] : null;

  // Toolbar derived state
  const fontIdx = Math.max(0, FONT_SIZES.findIndex((f) => f.value === fontSize));
  const lhIdx = Math.max(0, LINE_HEIGHTS.findIndex((l) => l.value === lineHeight));
  const toolBtn = (active = false) =>
    `inline-flex h-8 w-8 shrink-0 items-center justify-center transition-colors disabled:opacity-30 disabled:hover:text-muted-foreground ${
      active ? 'text-primary' : 'text-muted-foreground hover:text-primary'
    }`;

  function toggleSearch() {
    const opening = !searchOpen;
    setSearchOpen(opening);
    if (!opening) {
      setSearchQuery('');
      setSearchResults([]);
    }
  }

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-12 print:py-4">
      {/* Header */}
      <div ref={headerRef} className="text-center mb-8 print:mb-4">
        <p className="label-plate mb-3">{subject.subtitle}</p>
        <h1 className="text-3xl md:text-4xl font-heading font-semibold text-foreground tracking-tight">
          {subject.title}
        </h1>
        <p className="text-secondary-foreground mt-3 max-w-[560px] mx-auto leading-relaxed">
          {subject.description}
        </p>
      </div>

      {/* Reading toolbar — bookdown 风格纤细 sticky 工具条 */}
      <div className="sticky top-[68px] z-40 -mx-6 mb-8 flex h-11 items-center justify-between gap-3 border-b border-border bg-background/80 px-6 backdrop-blur print:hidden">
        {/* Left: TOC toggle + current chapter */}
        <div className="flex min-w-0 items-center">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? '收起目录' : '展开目录'}
            title={sidebarOpen ? '收起目录' : '展开目录'}
            className={toolBtn(sidebarOpen)}
          >
            <PanelLeft size={16} />
          </button>
          {activeChapter && (
            <span className="ml-2 truncate text-xs text-muted-foreground">
              {activeChapter.title}
            </span>
          )}
        </div>

        {/* Right controls */}
        <div className="flex shrink-0 items-center">
          <button
            onClick={() => setFontSize(FONT_SIZES[Math.max(0, fontIdx - 1)].value)}
            disabled={fontIdx <= 0}
            aria-label="减小字号"
            title="减小字号 (A-)"
            className={toolBtn()}
          >
            <Minus size={15} />
          </button>
          <button
            onClick={() => setFontSize(FONT_SIZES[Math.min(FONT_SIZES.length - 1, fontIdx + 1)].value)}
            disabled={fontIdx >= FONT_SIZES.length - 1}
            aria-label="增大字号"
            title="增大字号 (A+)"
            className={toolBtn()}
          >
            <Plus size={15} />
          </button>
          <button
            onClick={() => setLineHeight(LINE_HEIGHTS[(lhIdx + 1) % LINE_HEIGHTS.length].value)}
            aria-label="切换行距"
            title={`行距：${LINE_HEIGHTS[lhIdx].label}（点击切换）`}
            className={toolBtn(lineHeight !== 1.7)}
          >
            <AlignJustify size={15} />
          </button>
          <button
            onClick={toggleSearch}
            aria-label={searchOpen ? '收起搜索' : '搜索'}
            title={searchOpen ? '收起搜索' : '搜索'}
            className={toolBtn(searchOpen)}
          >
            <Search size={15} />
          </button>
          {searchOpen && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                autoFocus
                placeholder={searchScope === 'subject' ? '搜索本学科内容...' : '搜索全部学科内容...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-36 border-b border-border bg-transparent py-1 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary md:w-52"
              />
              <select
                value={searchScope}
                onChange={(e) => setSearchScope(e.target.value as 'subject' | 'all')}
                className="cursor-pointer border-b border-border bg-transparent py-1 text-xs text-muted-foreground outline-none transition-colors focus:border-primary"
              >
                <option value="subject">本学科</option>
                <option value="all">全部学科</option>
              </select>
            </div>
          )}
          <button
            onClick={handlePrint}
            aria-label="打印"
            title="打印"
            className={toolBtn()}
          >
            <Printer size={15} />
          </button>
        </div>

        {/* Search results — 工具条下方浮层 */}
        {searchOpen && searchResults.length > 0 && (
          <div className="card-scroll absolute right-6 top-full mt-2 w-[min(640px,calc(100vw-3rem))] divide-y divide-border/40">
            {searchResults.map((r) => (
              <button
                key={r.chapter.id}
                onClick={() => {
                  // 全局搜索结果可能跨学科：用章节自身的 subjectId 跳转
                  navigate(`/knowledge/${r.chapter.subjectId}/${r.chapter.id}/`);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="w-full px-4 py-3 text-left transition-colors hover:bg-card/50"
              >
                <p className="text-sm font-medium text-foreground">{r.chapter.title}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                  {r.chapter.content.slice(0, 100)}...
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Sidebar */}
        <aside
          className={`lg:shrink-0 transition-all duration-300 print:hidden ${
            sidebarOpen ? 'lg:w-64' : 'lg:w-0 lg:overflow-hidden'
          }`}
        >
          <div className="lg:sticky lg:top-24 bg-card border border-border rounded p-4">
            <Link
              to="/knowledge/"
              className="text-sm text-primary hover:text-primary/80 transition-colors mb-5 inline-flex items-center gap-1"
            >
              <ChevronLeft size={14} />
              返回学科列表
            </Link>
            <h3 className="label-plate mb-3">章节导航</h3>
            <nav className="space-y-0.5">
              {chapters.map((c) => {
                const active = c.id === activeChapter?.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => goToChapter(c.id)}
                    className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded text-sm transition-colors ${
                      active
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-background'
                    }`}
                  >
                    <span className="truncate">{c.title}</span>
                  </button>
                );
              })}
            </nav>

            <h3 className="label-plate mt-6 mb-3">其他学科</h3>
            <nav className="space-y-0.5">
              {knowledgeSubjects
                .filter((s) => s.id !== subject.id)
                .map((s) => (
                  <Link
                    key={s.id}
                    to={`/knowledge/${s.id}/`}
                    className="flex items-center gap-2.5 px-3 py-2 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
                  >
                    <span className="truncate">{s.title}</span>
                  </Link>
                ))}
            </nav>
          </div>
        </aside>

        {/* Article */}
        <article
          ref={contentRef}
          className="flex-1 min-w-0 max-w-[680px] print:max-w-none"
        >
          {activeChapter ? (
            <>
              <div className="mb-6 pb-4 border-b border-border/40 print:border-foreground/20">
                <h2 className="text-2xl font-heading font-semibold text-foreground">
                  {activeChapter.title}
                </h2>
              </div>
              {/* R5：正文走构建期 bundle（content.ts import.meta.glob），不再运行时 fetch */}
              <MarkdownRenderer content={activeChapter.content} />
            </>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              <p>该学科暂无章节内容</p>
            </div>
          )}

          {/* Chapter nav */}
          {chapters.length > 1 && activeChapter && (
            <nav className="mt-14 pt-6 border-t border-border/40 flex justify-between text-sm print:hidden">
              <span>
                {(() => {
                  const cIdx = chapters.findIndex((c) => c.id === activeChapter.id);
                  const prevCh = cIdx > 0 ? chapters[cIdx - 1] : null;
                  return prevCh ? (
                    <button
                      onClick={() => goToChapter(prevCh.id)}
                      className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                    >
                      <ChevronLeft size={14} />
                      {prevCh.title}
                    </button>
                  ) : null;
                })()}
              </span>
              <span>
                {(() => {
                  const cIdx = chapters.findIndex((c) => c.id === activeChapter.id);
                  const nextCh = cIdx < chapters.length - 1 ? chapters[cIdx + 1] : null;
                  return nextCh ? (
                    <button
                      onClick={() => goToChapter(nextCh.id)}
                      className="text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1"
                    >
                      {nextCh.title}
                      <ChevronRight size={14} />
                    </button>
                  ) : null;
                })()}
              </span>
            </nav>
          )}

          {/* Subject nav */}
          <nav className="mt-8 pt-6 border-t border-border/40 flex justify-between text-sm print:hidden">
            <span>
              {prev && (
                <Link
                  to={`/knowledge/${prev.id}/`}
                  className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                >
                  <ChevronLeft size={14} />
                  {prev.title}
                </Link>
              )}
            </span>
            <span>
              {next && (
                <Link
                  to={`/knowledge/${next.id}/`}
                  className="text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1"
                >
                  {next.title}
                  <ChevronRight size={14} />
                </Link>
              )}
            </span>
          </nav>
        </article>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .print\\:hidden { display: none !important; }
          .print\\:py-4 { padding-top: 1rem !important; padding-bottom: 1rem !important; }
          .print\\:mb-4 { margin-bottom: 1rem !important; }
          .print\\:max-w-none { max-width: none !important; }
          .print\\:border-foreground\\/20 { border-color: rgba(0,0,0,0.2) !important; }
          article { font-size: 12pt !important; line-height: 1.6 !important; }
          h1, h2, h3 { page-break-after: avoid; }
          pre, table { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
