import { useRef, useEffect, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

type RevealDirection = 'left' | 'right' | 'bottom' | 'fade';

interface ScrollRevealOptions {
  from?: RevealDirection;
  delay?: number;
  duration?: number;
  start?: string;
}

const REDUCED_MOTION =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: ScrollRevealOptions = {},
): RefObject<T | null> {
  const ref = useRef<T | null>(null);
  const { from = 'fade', delay = 0, duration = 0.8, start = 'top 88%' } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // ── Reduced motion: show immediately with no animation ──
    if (REDUCED_MOTION) {
      el.style.opacity = '1';
      el.style.transform = 'none';
      return;
    }

    const fromVars: gsap.TweenVars = (() => {
      switch (from) {
        case 'left':
          return { x: -60, opacity: 0 };
        case 'right':
          return { x: 60, opacity: 0 };
        case 'bottom':
          return { y: 60, opacity: 0 };
        case 'fade':
        default:
          return { opacity: 0 };
      }
    })();

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        fromVars,
        {
          x: 0,
          y: 0,
          opacity: 1,
          duration,
          delay,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start,
            // play on enter, reverse on leave → replay on re-enter for discovery feel
            toggleActions: 'play none play none',
          },
        },
      );
    }, el);

    return () => ctx.revert();
  }, [from, delay, duration, start]);

  return ref;
}
