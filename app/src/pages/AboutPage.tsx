import { useScrollReveal } from '../animations/useScrollReveal';
import PageHero from '../components/PageHero';
import { Github } from 'lucide-react';

const goals = [
  '为行星科学学习者提供系统化、结构化的知识整理',
  '汇集领域内的优质资源与学者信息',
  '促进行星科学知识的传播与共享',
];

const features = [
  { label: '系统化知识', desc: '基于经典教材与文献，构建行星科学知识体系' },
  { label: 'Markdown 原生', desc: '所有内容使用 Markdown 编写，支持数学公式（KaTeX）与 Obsidian Callout' },
  { label: '开源共享', desc: '代码与内容完全开源，欢迎贡献与反馈' },
  { label: '持续更新', desc: 'Vite + React 驱动，内容通过 Git 版本管理' },
];

const techStack = [
  { name: 'React 19', url: 'https://react.dev' },
  { name: 'Vite 7', url: 'https://vite.dev' },
  { name: 'TypeScript', url: 'https://www.typescriptlang.org' },
  { name: 'Tailwind CSS', url: 'https://tailwindcss.com' },
  { name: 'shadcn/ui', url: 'https://ui.shadcn.com' },
  { name: 'Three.js / Vanta', url: 'https://www.vantajs.com' },
  { name: 'GSAP', url: 'https://gsap.com' },
  { name: 'Lenis', url: 'https://lenis.studiofreight.com' },
  { name: 'KaTeX', url: 'https://katex.org' },
];

export default function AboutPage() {
  const contentRef = useScrollReveal<HTMLDivElement>({ from: 'bottom', duration: 0.8, delay: 0.1 });

  return (
    <>
      <PageHero
        title="关于我们"
        titleEn="ABOUT"
        wireframe="poly"
        labelLeft="OPEN SOURCE"
        labelRight="KNOWLEDGE HUB"
      />

      <div className="max-w-[680px] mx-auto px-6 pb-24 md:pb-32">
      <article ref={contentRef} className="space-y-12">
        <p className="text-lg text-secondary-foreground leading-relaxed">
          <strong className="text-foreground font-semibold">行星科学知识库</strong>{' '}
          (Planetary Science Knowledge Hub) 是一个致力于行星科学教育与资源共享的开放平台。
        </p>

        <section>
          <h2 className="text-xl font-heading font-semibold text-foreground mb-4">目标</h2>
          <ul className="space-y-3">
            {goals.map((item) => (
              <li key={item} className="flex items-start gap-3 text-secondary-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-heading font-semibold text-foreground mb-4">技术栈</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {techStack.map((tech) => (
              <a
                key={tech.name}
                href={tech.url}
                target="_blank"
                rel="noopener noreferrer"
                className="card-scroll px-4 py-3 text-sm text-muted-foreground hover:text-primary text-center"
              >
                {tech.name}
              </a>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-heading font-semibold text-foreground mb-4">网站特色</h2>
          <ul className="space-y-3">
            {features.map((item) => (
              <li key={item.label} className="flex items-start gap-3 text-secondary-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2" />
                <span>
                  <strong className="text-foreground font-medium">{item.label}</strong>：{item.desc}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-heading font-semibold text-foreground mb-4">如何贡献</h2>
          <p className="text-secondary-foreground mb-4 leading-relaxed">
            如果你有建议或想要贡献内容，欢迎通过以下方式参与：
          </p>
          <ul className="space-y-2.5 text-secondary-foreground">
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2" />
              在{' '}
              <a
                href="https://github.com/Astrobiology-cn/Astrobiology-cn.github.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1"
              >
                <Github size={14} />
                GitHub
              </a>{' '}
              上提交 Issue 或 Pull Request
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2" />
              使用 Obsidian 编辑知识文档，通过 Git 同步到网站
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2" />
              联系管理员推荐新的学习资源或学者信息
            </li>
          </ul>
        </section>

        <hr className="border-border/40" />
        <p className="text-sm text-muted-foreground">本站内容仅供学习交流使用，版权归原作者及出版方所有。</p>
        <p className="text-sm text-muted-foreground mt-2">
          行星纹理来自{' '}
          <a
            href="https://www.solarsystemscope.com/textures/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 transition-colors"
          >
            Solar System Scope
          </a>
          （CC BY 4.0）；图标来自 SVG Repo。
        </p>
      </article>
      </div>
    </>
  );
}
