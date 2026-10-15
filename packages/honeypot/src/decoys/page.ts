import { createHash } from 'node:crypto';

/**
 * The shell of the mock pages. A comic sans lookalike from Google Fonts (Comic Neue) and a classless stylesheet from a CDN, both pinned: the pages
 * are only bare elements, so nothing else is needed. Everything dynamic is escaped, nothing here is meant to be safe to copy anywhere else
 */
export const FONT_STYLESHEET = 'https://fonts.googleapis.com/css2?family=Comic+Neue:wght@400;700&display=swap';
export const CSS_LIBRARY = 'https://cdn.jsdelivr.net/npm/water.css@2.1.1/out/light.min.css';

/**
 * What a page needs to load, as a Content-Security-Policy (the site's own, which allows almost nothing, would block the font and the stylesheet).
 * The one inline script is allowed by its hash, nothing else may run, and the form posts nowhere the script does not already stop
 */
export const decoyCsp = (script?: string): string =>
  [
    "default-src 'none'",
    `style-src 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net`,
    'font-src https://fonts.gstatic.com',
    ...(script ? [`script-src 'sha256-${createHash('sha256').update(script).digest('base64')}'`] : []),
    "form-action 'self'",
    "base-uri 'none'",
  ].join(';');

export const escapeHtml = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export interface HtmlPage {
  html: string;
  /** The inline script of the page, whose hash the page's CSP allows */
  script?: string;
}

export const htmlPage = ({
  title,
  body,
  css = '',
  script,
  bodyClass,
}: {
  title: string;
  body: string;
  css?: string;
  script?: string;
  /** What the real page puts on `<body>` */
  bodyClass?: string;
}): HtmlPage => ({
  script,
  html: `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${escapeHtml(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONT_STYLESHEET}">
<link rel="stylesheet" href="${CSS_LIBRARY}">
<style>body,input,button,select,textarea{font-family:'Comic Neue','Comic Sans MS','Comic Sans',cursive}${css}</style>
</head>
<body${bodyClass ? ` class="${bodyClass}"` : ''}>
${body}
${script ? `<script>${script}</script>\n` : ''}</body>
</html>
`,
});
