import { Fragment, ReactNode, createElement } from 'react';

const INLINE_TAGS = new Set(['b', 'strong', 'i', 'em', 'u', 'code', 'br', 'small']);

const safeHref = (href: string | null) => (href && /^(https?:\/\/|\/(?!\/))/i.test(href.trim()) ? href.trim() : null);

const convert = (node: Node, key: string): ReactNode => {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent;
  if (node.nodeType !== Node.ELEMENT_NODE) return null;
  const el = node as Element;
  const tag = el.tagName.toLowerCase();
  const children = Array.from(el.childNodes).map((child, i) => convert(child, `${key}.${i}`));
  if (tag === 'a') {
    const href = safeHref(el.getAttribute('href'));
    return href ? (
      <a key={key} href={href} {...(/^https?:/i.test(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
        {children}
      </a>
    ) : (
      <Fragment key={key}>{children}</Fragment>
    );
  }
  if (INLINE_TAGS.has(tag)) return createElement(tag, { key }, ...(tag === 'br' ? [] : children));
  // Anything else (scripts, images, event handlers…) is dropped but its text is kept
  return tag === 'script' || tag === 'style' ? null : <Fragment key={key}>{children}</Fragment>;
};

/**
 * Notices carry server-sanitized HTML, this only keeps a small set of inline tags and safe links before it reaches the page.
 * Needs a DOM, so call it in the browser only
 */
export const renderNoticeHtml = (html: string): ReactNode => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return Array.from(doc.body.childNodes).map((child, i) => convert(child, String(i)));
};

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/**
 * Notices can point at the page being viewed on the other site: `{path}` stands for the address of this page without the host
 * (`<a href="https://old.example.com{path}">`)
 */
export const substituteNoticePath = (html: string, path: string): string => html.split('{path}').join(escapeHtml(path));
