import { useSyncExternalStore } from 'react';

/**
 * Reactive check for the `dark` class on <html>.
 * Works across components regardless of which one toggled the theme.
 */
export function useIsDark(): boolean {
  return useSyncExternalStore(
    (callback) => {
      const observer = new MutationObserver(callback);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      });
      return () => observer.disconnect();
    },
    () => document.documentElement.classList.contains('dark'),
    () => true,
  );
}
