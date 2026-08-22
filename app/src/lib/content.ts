/* Content loader for markdown-driven site data.
 * Uses Vite import.meta.glob to bundle md files at build time;
 * frontmatter 解析用 gray-matter（js-yaml 标准 YAML），
 * 浏览器侧经 ./bufferShim 提供最小 Buffer 垫片（必须最先导入）。
 */

import './bufferShim';
import matter from 'gray-matter';

/* R5：手写 YAML 解析器退役，换 gray-matter。两类语义差异已在内容侧消解：
 * 1) `color: #XXX` 未加引号在标准 YAML 里是注释 → null（6 处 _index.md 已加引号）；
 * 2) `date: 2026-06-10` 被 js-yaml 解析为 Date（news loader 统一转回 YYYY-MM-DD 字符串）；
 * 另修复 jgr-planets.md 未加引号的 `name: ...: Planets`（标准 YAML 非法）。 */
function parseFrontmatter(raw: string): { data: Record<string, any>; content: string } {
  const { data, content } = matter(raw);
  return { data, content: content.trim() };
}

export interface Scholar {
  id: string;
  name: string;
  nameCn?: string;
  institution: string;
  institutionCn?: string;
  country: string;
  fields: string[];
  bio: string;
  highlight: string;
  homepage: string;
  featured: boolean;
  order: number;
}

export interface Resource {
  id: string;
  name: string;
  description: string;
  url: string;
  language: string;
  tag: string;
  category: 'databases' | 'tools' | 'journals' | 'conferences' | 'education';
  featured: boolean;
  order: number;
}

export interface ResourceCategory {
  key: string;
  label: string;
  icon: string;
  items: Resource[];
}

export interface KnowledgeSubject {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  featured: boolean;
  order: number;
  icon: string;
  color: string;
}

export interface KnowledgeChapter {
  id: string;
  subjectId: string;
  title: string;
  order: number;
  content: string;
}

/* ── Frontmatter 解析（gray-matter，垫片与差异说明见文件头） ── */

/* ── Load scholars ── */
const scholarModules = import.meta.glob('../content/scholars/*.md', { eager: true, as: 'raw' });

export const scholarsData: Scholar[] = Object.entries(scholarModules)
  .map(([_path, raw]) => {
    const { data } = parseFrontmatter(raw as string);
    return {
      id: data.id,
      name: data.name,
      nameCn: data.nameCn,
      institution: data.institution,
      institutionCn: data.institutionCn,
      country: data.country,
      fields: Array.isArray(data.fields) ? data.fields : [],
      bio: data.bio || '',
      highlight: data.highlight || '',
      homepage: data.homepage || '',
      featured: Boolean(data.featured),
      order: Number(data.order) || 99,
    } satisfies Scholar;
  })
  .sort((a, b) => a.order - b.order);

/* ── Load resources ── */
const resourceModules = import.meta.glob('../content/resources/*.md', { eager: true, as: 'raw' });

const resourceList: Resource[] = Object.entries(resourceModules)
  .map(([_path, raw]) => {
    const { data } = parseFrontmatter(raw as string);
    return {
      id: data.id,
      name: data.name,
      description: data.description || '',
      url: data.url || '',
      language: data.language || '',
      tag: data.tag || '',
      category: data.category || 'databases',
      featured: Boolean(data.featured),
      order: Number(data.order) || 99,
    } satisfies Resource;
  })
  .sort((a, b) => a.order - b.order);

const categoryLabels: Record<string, string> = {
  databases: '数据库',
  tools: '工具',
  journals: '期刊',
  conferences: '会议',
  education: '教育',
};

export const resourcesData: ResourceCategory[] = ['databases', 'tools', 'journals', 'conferences', 'education'].map(
  (key) => ({
    key,
    label: categoryLabels[key] || key,
    icon: key,
    items: resourceList.filter((r) => r.category === key),
  }),
);

/* ── Load knowledge subjects ── */
const knowledgeModules = import.meta.glob('../content/knowledge/*/_index.md', { eager: true, as: 'raw' });

export const knowledgeSubjects: KnowledgeSubject[] = Object.entries(knowledgeModules)
  .map(([path, raw]) => {
    const { data } = parseFrontmatter(raw as string);
    const folder = path.split('/').slice(-2)[0];
    return {
      id: folder,
      title: data.title || folder,
      subtitle: data.subtitle || '',
      description: data.description || '',
      category: data.category || '',
      featured: Boolean(data.featured),
      order: Number(data.order) || 99,
      icon: data.icon || '📚',
      color: data.color || '#6366F1',
    } satisfies KnowledgeSubject;
  })
  .sort((a, b) => a.order - b.order);

/* ── Load knowledge chapters ── */
const chapterModules = import.meta.glob('../content/knowledge/*/*.md', { eager: true, as: 'raw' });

export const knowledgeChapters: KnowledgeChapter[] = Object.entries(chapterModules)
  .filter(([path]) => !path.endsWith('_index.md'))
  .map(([path, raw]) => {
    const { data, content } = parseFrontmatter(raw as string);
    const parts = path.split('/');
    const subjectId = parts[parts.length - 2];
    const fileName = parts[parts.length - 1].replace('.md', '');
    return {
      id: fileName,
      subjectId,
      title: data.title || fileName,
      order: Number(data.order) || 99,
      content: content || '',
    } satisfies KnowledgeChapter;
  })
  .sort((a, b) => a.order - b.order);

export function getChaptersBySubject(subjectId: string): KnowledgeChapter[] {
  return knowledgeChapters.filter((c) => c.subjectId === subjectId);
}

export function getSubjectById(id: string): KnowledgeSubject | undefined {
  return knowledgeSubjects.find((s) => s.id === id);
}

/* ── Load news ── */
export interface News {
  id: string;
  title: string;
  summary: string;
  date: string;
  category: 'knowledge' | 'scholars' | 'resources';
  coverVariant: number;
  order: number;
  content: string;
}

const newsModules = import.meta.glob('../content/news/*.md', { eager: true, as: 'raw' });

export const newsData: News[] = Object.entries(newsModules)
  .map(([_path, raw]) => {
    const { data, content } = parseFrontmatter(raw as string);
    return {
      id: data.id,
      title: data.title || '',
      summary: data.summary || '',
      // js-yaml 把 `date: 2026-06-10` 解析为 Date 对象——统一转回 ISO 日期字符串
      date: data.date instanceof Date ? data.date.toISOString().slice(0, 10) : String(data.date ?? ''),
      category: data.category || 'knowledge',
      coverVariant: Number(data.coverVariant) || 1,
      order: Number(data.order) || 99,
      content: content || '',
    } satisfies News;
  })
  .sort((a, b) => a.order - b.order);

export function getNewsByCategory(category: News['category']): News[] {
  return newsData.filter((n) => n.category === category);
}

export function getNewsById(id: string): News | undefined {
  return newsData.find((n) => n.id === id);
}

/* ── Navigation items ── */
export const navItems = [
  { label: '首页', href: '/' },
  {
    label: '学科知识',
    href: '/knowledge/',
    children: knowledgeSubjects.map((s) => ({ label: s.title, href: `/knowledge/${s.id}/` })),
  },
  { label: '学者信息', href: '/scholars/' },
  { label: '外部资源', href: '/resources/' },
  { label: '关于我们', href: '/about/' },
];

/* ── Legacy compatibility helpers ── */
export const knowledgeCards = knowledgeSubjects.map((s) => ({
  icon: s.icon,
  title: s.title,
  desc: s.description,
  href: `/knowledge/${s.id}/`,
}));
