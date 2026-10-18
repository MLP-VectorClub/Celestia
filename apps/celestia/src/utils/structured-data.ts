import { UrlObject } from 'url';

import { assembleSeoUrl } from 'src/utils/common';

export interface BreadcrumbJsonLdItem {
  name: string;
  /** What the entry links to, `undefined` for the page being viewed and for entries that are only labels */
  href?: string | UrlObject;
}

const hrefToString = (href: string | UrlObject): string => {
  if (typeof href === 'string') return href;
  const query =
    href.query && typeof href.query === 'object'
      ? new URLSearchParams(
          Object.entries(href.query).flatMap(([key, value]) =>
            Array.isArray(value) ? value.map((v) => [key, String(v)]) : [[key, String(value)]]
          )
        )
      : null;
  return `${href.pathname ?? ''}${query && query.size > 0 ? `?${query.toString()}` : ''}${href.hash ? `#${href.hash.replace(/^#/, '')}` : ''}`;
};

/** Links on the site are given as paths, search engines want the whole address */
export const absoluteUrl = (href: string | UrlObject): string => {
  const value = hrefToString(href);
  return value.startsWith('/') && !value.startsWith('//') ? assembleSeoUrl(value) : value;
};

/**
 * schema.org's BreadcrumbList (the old site marked its breadcrumbs up the same way, with microdata).
 * Google requires `item` on every entry but the last, so label-only entries in the middle are left out and
 * the last one (the page being viewed) falls back to `currentHref`.
 */
export const breadcrumbListJsonLd = (items: BreadcrumbJsonLdItem[], currentHref?: string | UrlObject) => {
  const entries = items.flatMap(({ name, href }, i) => {
    const isLast = i === items.length - 1;
    const target = href ?? (isLast ? currentHref : undefined);
    if (!target && !isLast) return [];
    return [{ name, item: target ? absoluteUrl(target) : undefined }];
  });
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: entries.map(({ name, item }, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name,
      ...(item ? { item } : {}),
    })),
  };
};

/** For the body of a `<script type="application/ld+json">`: nothing in the data may close the tag early */
export const serializeJsonLd = (data: unknown): string => JSON.stringify(data).replace(/</g, '\\u003c');
