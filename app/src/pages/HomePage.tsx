import { Fragment, useRef, useEffect } from 'react';
import { Link } from 'react-router';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import PlanetHero from '../components/PlanetHero';
import RocketManifesto from '../components/RocketManifesto';
import KnowledgeScene from '../components/backgrounds/scenes/KnowledgeScene';
import ScholarsScene from '../components/backgrounds/scenes/ScholarsScene';
import ResourcesScene from '../components/backgrounds/scenes/ResourcesScene';
import { useScrollReveal } from '../animations/useScrollReveal';

gsap.registerPlugin(ScrollTrigger);

const sections = [
  {
    id: 'knowledge',
    title: '学科知识',
    desc: '系统化的行星科学核心知识体系，从数学物理基础到遥感技术应用。',
    link: '/knowledge/',
    linkText: '进入学科知识',
    Scene: KnowledgeScene,
  },
  {
    id: 'scholars',
    title: '学者信息',
    desc: '汇集国内外行星科学领域的知名学者与研究机构。',
    link: '/scholars/',
    linkText: '进入学者信息',
    Scene: ScholarsScene,
  },
  {
    id: 'resources',
    title: '外部资源',
    desc: '精选数据库、分析工具、权威期刊、学术会议和教育资源。',
    link: '/resources/',
    linkText: '进入外部资源',
    Scene: ResourcesScene,
  },
];

/* ═══════════════════════════════════════════════════════════════════
   Hero — Sanctuary 首页：词标居中，行星如月，缓缓浮现
   ═══════════════════════════════════════════════════════════════════ */
function Hero() {
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      gsap.to(el, {
        y: -60,
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: '#hero',
          start: 'top top',
          end: '60% top',
          scrub: true,
        },
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <PlanetHero id="hero">
      <div className="flex-1 flex items-center justify-center pt-28 pb-16">
        <div ref={textRef} className="text-center px-6">
          <h1 className="stagger-item stagger-2 font-heading font-semibold leading-[1.05] text-foreground text-6xl sm:text-7xl md:text-8xl lg:text-9xl mb-6 tracking-[0.12em] mr-[-0.12em]">
            行星科学
          </h1>

          <p className="stagger-item stagger-3 label-plate mb-14">
            Planetary Science Knowledge Hub
          </p>

          <div className="stagger-item stagger-4 mt-4 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10">
            <Link to="/knowledge/" className="btn-copper">
              浏览学科
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              to="/about/"
              className="link-underline text-[13px] font-semibold tracking-[0.15em] uppercase text-secondary-foreground hover:text-foreground transition-colors"
            >
              关于项目
            </Link>
          </div>
        </div>
      </div>
    </PlanetHero>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Bottom CTA
   ═══════════════════════════════════════════════════════════════════ */
function BottomCta() {
  const ref = useScrollReveal<HTMLElement>({ from: 'fade', duration: 0.8 });

  return (
    <section
      ref={ref}
      className="relative w-full py-32 md:py-44 text-center overflow-hidden border-t border-border/40"
    >
      <div className="relative z-10 max-w-[520px] mx-auto px-6">
        <span className="inline-block text-primary text-lg mb-8" aria-hidden="true">✦</span>
        <h2 className="mega-title text-foreground mb-6" style={{ fontSize: 'clamp(2.5rem, 1.8rem + 3.5vw, 5rem)' }}>
          Join Us
        </h2>
        <p className="label-plate mb-6">加入我们</p>
        <p className="text-secondary-foreground mb-12 leading-relaxed">
          行星科学知识库是完全开源的项目。贡献内容、修正错误，或者推荐你欣赏的学者与资源。
        </p>
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <a
            href="https://github.com/Astrobiology-cn/Astrobiology-cn.github.io"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-copper"
          >
            GitHub 参与贡献
          </a>
          <Link
            to="/about/"
            className="link-underline text-[13px] font-semibold tracking-[0.15em] uppercase text-secondary-foreground hover:text-foreground transition-colors"
          >
            了解项目
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TransitionBand — 幕间过渡带（version2 §5）
   纯空 section：背景透明透出全局星空，提供物理间隔，
   让上幕的消散/退场在带内完成、下幕成形在其后开始。
   ═══════════════════════════════════════════════════════════════════ */
function TransitionBand({ height = '40vh' }: { height?: string }) {
  return (
    <section
      aria-hidden="true"
      className="relative w-full bg-transparent"
      style={{ height }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════
   HomePage
   ═══════════════════════════════════════════════════════════════════ */
export default function HomePage() {
  return (
    <>
      <Hero />
      <TransitionBand />
      <RocketManifesto />
      <TransitionBand />
      {sections.map(({ id, Scene, ...props }, i) => (
        <Fragment key={id}>
          <Scene {...props} />
          {i < sections.length - 1 ? (
            <TransitionBand />
          ) : (
            <TransitionBand height="30vh" />
          )}
        </Fragment>
      ))}
      <BottomCta />
    </>
  );
}
