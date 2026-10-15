import { useLayoutEffect } from 'react';

/** The fixed footer of the site, which the picker must not slide under */
const FOOTER_HEIGHT = 38;
const MIN_HEIGHT = 480;

/**
 * Stretches an element from where it starts down to the footer, so the picker fills the page like the old site's did. The banners above it
 * (notices, the work-in-progress warning) come and go, so the height is worked out again whenever the page changes size
 */
export function useFillViewport(el: HTMLElement | null) {
  useLayoutEffect(() => {
    if (!el) return undefined;
    const target = el;
    const update = () => {
      const top = target.getBoundingClientRect().top + window.scrollY;
      target.style.height = `${Math.max(MIN_HEIGHT, Math.round(window.innerHeight - top - FOOTER_HEIGHT))}px`;
    };
    update();
    window.addEventListener('resize', update);
    const observer = new ResizeObserver(update);
    observer.observe(document.body);
    return () => {
      window.removeEventListener('resize', update);
      observer.disconnect();
    };
  }, [el]);
}
