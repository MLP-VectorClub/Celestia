import { useEffect, useRef, useState } from 'react';

/**
 * Turns `true` once the element came near the viewport, and stays that way. Without IntersectionObserver (old browsers, server
 * rendering) the element counts as seen right away on the client, so nothing stays hidden.
 */
export function useInView<T extends Element>(rootMargin = '300px') {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    if (seen) return undefined;
    const element = ref.current;
    if (!element) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setSeen(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [seen, rootMargin]);

  return [ref, seen] as const;
}
