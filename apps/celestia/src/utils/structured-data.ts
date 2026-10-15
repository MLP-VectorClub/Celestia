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

/** schema.org's BreadcrumbList (the old site marked its breadcrumbs up the same way, with microdata) */
export const breadcrumbListJsonLd = (items: BreadcrumbJsonLdItem[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map(({ name, href }, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name,
    ...(href ? { item: absoluteUrl(href) } : {}),
  })),
});

/** For the body of a `<script type="application/ld+json">`: nothing in the data may close the tag early */
export const serializeJsonLd = (data: unknown): string => JSON.stringify(data).replace(/</g, '\\u003c');
