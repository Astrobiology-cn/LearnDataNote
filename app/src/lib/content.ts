/* Content loader for markdown-driven site data.
 * Uses Vite import.meta.glob to bundle md files at build time,
 * then parses YAML frontmatter with a lightweight custom parser.
 */

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

/* ── Lightweight YAML frontmatter parser ── */
function parseFrontmatter(raw: string): { data: Record<string, any>; content: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { data: {}, content: raw };

  const [, yaml, content] = match;
  const data: Record<string, any> = {};
  const lines = yaml.split('\n');

  let currentKey = '';
  let inArray = false;
  let arrayItems: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('- ') && inArray && currentKey) {
      arrayItems.push(trimmed.slice(2).replace(/^["']|["']$/g, ''));
      continue;
    }

    if (inArray && currentKey) {
      data[currentKey] = arrayItems;
      arrayItems = [];
      inArray = false;
    }

    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;

    const key = trimmed.slice(0, colonIdx).trim();
    let value: any = trimmed.slice(colonIdx + 1).trim();

    if (value === '') {
      currentKey = key;
      inArray = true;
      arrayItems = [];
      continue;
    }

    // Remove quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    // Boolean
    if (value === 'true') value = true;
    else if (value === 'false') value = false;
    // Number
    else if (!isNaN(Number(value)) && value !== '') value = Number(value);
    // Inline array [a, b, c]
    else if (value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1).split(',').map((s: string) => s.trim().replace(/^["']|["']$/g, ''));
    }

    data[key] = value;
  }

  if (inArray && currentKey) {
    data[currentKey] = arrayItems;
  }

  return { data, content: content.trim() };
}

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
      date: data.date || '',
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
