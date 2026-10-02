import { useEffect, useState } from 'react';

import { Size } from 'src/utils/picker/viewport';

/** Size of an element in CSS pixels, kept up to date while it is resized. `0 × 0` until there is an element and it has been measured */
export function useViewSize(el: HTMLElement | null): Size {
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  useEffect(() => {
    if (!el) return undefined;
    const update = () => setSize({ width: el.clientWidth, height: el.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [el]);

  return size;
}
