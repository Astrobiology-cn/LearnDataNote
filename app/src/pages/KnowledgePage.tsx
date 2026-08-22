import { Link } from 'react-router';
import PageHero from '../components/PageHero';
import NewsCarousel from '../components/NewsCarousel';
import SubjectIcon from '../components/SubjectIcon';
import { knowledgeSubjects } from '../lib/content';
import type { KnowledgeSubject } from '../lib/content';
import { useScrollReveal } from '../animations/useScrollReveal';

const categoryOrder = ['基础理论', '行星与地质', '化学与遥感'];

function SubjectCard({ subject, large = false }: { subject: KnowledgeSubject; large?: boolean }) {
  return (
    <Link
      to={`/knowledge/${subject.id}/`}
      className={`card-space group p-6 flex flex-col gap-4 ${large ? 'min-h-[260px]' : 'min-h-[220px]'}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-foreground/70 group-hover:text-primary transition-colors">
          <SubjectIcon id={subject.id} size={large ? 52 : 40} />
        </span>
        <span className="text-xs text-muted-foreground font-mono opacity-0 group-hover:opacity-100 transition-opacity">
          开始学习 →
        </span>
      </div>

      <div className="mt-auto">
        <p className="label-plate mb-2">{subject.subtitle}</p>
        <h3
          className={`${large ? 'text-xl' : 'text-lg'} font-heading font-semibold text-foreground group-hover:text-primary transition-colors mb-2`}
        >
          {subject.title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{subject.description}</p>
      </div>
    </Link>
  );
}

export default function KnowledgePage() {
  const featuredRef = useScrollReveal<HTMLDivElement>({ from: 'bottom', duration: 0.7, delay: 0.15 });

  const featuredSubjects = knowledgeSubjects.filter((s) => s.featured).slice(0, 3);
  const categories = categoryOrder
    .map((cat) => ({ label: cat, items: knowledgeSubjects.filter((s) => s.category === cat) }))
    .filter((c) => c.items.length > 0);

  return (
    <>
      <PageHero
        title="学科知识"
        titleEn="KNOWLEDGE"
        wireframe="orbit"
        labelLeft="SIX DISCIPLINES"
        labelRight="SYSTEMATIC KNOWLEDGE"
        description="基于经典教材与前沿文献，系统构建行星科学核心知识体系。"
      />

      <div className="max-w-[1280px] mx-auto px-6 mb-24">
        <NewsCarousel category="knowledge" />
      </div>

      <div className="max-w-[1280px] mx-auto px-6 pb-24 md:pb-32">
        {featuredSubjects.length > 0 && (
          <div ref={featuredRef} className="mb-20">
            <h2 className="label-plate mb-6 text-center">精选学科</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {featuredSubjects.map((subject) => (
                <SubjectCard key={subject.id} subject={subject} large />
              ))}
            </div>
          </div>
        )}

        {categories.map((cat) => (
          <CategorySection key={cat.label} label={cat.label} items={cat.items} />
        ))}

        <div className="mt-16 text-center card-space p-8">
          <p className="text-sm text-muted-foreground mb-3">
            更多学科内容正在建设中，欢迎通过 GitHub 贡献内容
          </p>
          <a
            href="https://github.com/Astrobiology-cn/Astrobiology-cn.github.io"
            target="_blank"
            rel="noopener noreferrer"
            className="link-underline text-[13px] font-semibold tracking-[0.15em] uppercase text-primary"
          >
            前往 GitHub 仓库 →
          </a>
        </div>
      </div>
    </>
  );
}

function CategorySection({ label, items }: { label: string; items: KnowledgeSubject[] }) {
  const sectionRef = useScrollReveal<HTMLDivElement>({ from: 'bottom', duration: 0.7 });

  return (
    <div ref={sectionRef} className="mb-16">
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-xl font-heading font-semibold text-foreground">{label}</h2>
        <div className="flex-1 h-px bg-border/40" />
        <span className="label-plate">{items.length} 个学科</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((subject) => (
          <SubjectCard key={subject.id} subject={subject} />
        ))}
      </div>
    </div>
  );
}
