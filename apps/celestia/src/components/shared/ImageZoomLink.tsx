import { AnchorHTMLAttributes, FC, MouseEvent, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import styles from 'modules/ImageZoom.module.scss';

interface Props extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  /** The full size image: where the link goes with a modifier key or middle click, and what the overlay shows */
  href: string;
  alt: string;
}

/**
 * The old site's image zoom (fluidbox): a plain click shows the full size image over the page until it is clicked again or Escape is pressed,
 * the link itself (new tab, copy address, modifier clicks) keeps working
 */
export const ImageZoomLink: FC<Props> = ({ href, alt, children, onClick, ...rest }) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    // Captured so that Escape closes only the overlay, not a dialog the image is in
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      setOpen(false);
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open]);

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    setOpen(true);
  };

  return (
    <>
      <a href={href} target="_blank" rel="noopener noreferrer" onClick={handleClick} {...rest}>
        {children}
      </a>
      {open &&
        createPortal(
          <div className={styles.backdrop} role="dialog" aria-modal="true" aria-label={alt} onClick={() => setOpen(false)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={href} alt={alt} />
          </div>,
          document.body
        )}
    </>
  );
};
