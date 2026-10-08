'use client';

import { useEffect } from 'react';

export default function ScrollBehavior() {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Ignore modified clicks (Ctrl, Cmd, Shift, Alt) so they open in new tabs if needed
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

      const link = (e.target as HTMLElement).closest('a');
      if (!link || !link.hash) return;

      // Only handle same-page hash links
      if (link.pathname === window.location.pathname) {
        const targetId = link.hash.substring(1);
        const targetElement = document.getElementById(targetId);

        if (targetElement) {
          e.preventDefault();

          const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          const behavior = prefersReducedMotion ? 'auto' : 'smooth';

          targetElement.scrollIntoView({ behavior });

          // Preserve URL hash without jumping
          window.history.pushState(null, '', link.hash);
        }
      }
    };

    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []);

  return null;
}
