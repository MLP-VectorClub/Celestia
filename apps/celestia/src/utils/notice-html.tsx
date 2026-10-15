import HtmlToReact, { Parser as HtmlToReactParser, ProcessingInstruction } from 'html-to-react';
import { Fragment, ReactNode, createElement } from 'react';

const INLINE_TAGS = new Set(['b', 'strong', 'i', 'em', 'u', 'code', 'br', 'small']);

const safeHref = (href: string | undefined) => (href && /^(https?:\/\/|\/(?!\/))/i.test(href.trim()) ? href.trim() : null);

const processNodeDefinitions = new HtmlToReact.ProcessNodeDefinitions();
const instructions: ProcessingInstruction[] = [
  {
    shouldProcessNode: (node) => node.name === 'a',
    processNode: (node, children, index) => {
      const href = safeHref(node.attribs?.href);
      return href ? (
        <a key={index} href={href} {...(/^https?:/i.test(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
          {children as ReactNode}
        </a>
      ) : (
        <Fragment key={index}>{children as ReactNode}</Fragment>
      );
    },
  },
  {
    // Kept as they are, without their attributes
    shouldProcessNode: (node) => node.type === 'tag' && INLINE_TAGS.has(node.name),
    processNode: (node, children, index) =>
      node.name === 'br' ? <br key={index} /> : createElement(node.name, { key: index }, children as ReactNode),
  },
  {
    // Scripts and styles are dropped with their content
    shouldProcessNode: (node) => node.name === 'script' || node.name === 'style',
    processNode: () => null,
  },
  {
    // Anything else (images, event handlers…) is dropped but its text is kept
    shouldProcessNode: (node) => node.type === 'tag',
    processNode: (_node, children, index) => <Fragment key={index}>{children as ReactNode}</Fragment>,
  },
  { shouldProcessNode: () => true, processNode: processNodeDefinitions.processDefaultNode },
];
const parser = new HtmlToReactParser();

/**
 * Notices carry server-sanitized HTML, this only keeps a small set of inline tags and safe links before it reaches the page.
 * Works on the server and in the browser, so a page can render notices from its first byte
 */
export const renderNoticeHtml = (html: string): ReactNode => {
  // The wrapper makes several top level nodes (text next to tags) come back as one element
  const wrapped = parser.parseWithInstructions(`<notice-root>${html}</notice-root>`, () => true, [
    {
      shouldProcessNode: (node) => node.name === 'notice-root',
      processNode: (_node, children) => <Fragment>{children as ReactNode}</Fragment>,
    },
    ...instructions,
  ]);
  return wrapped;
};

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/**
 * Notices can point at the page being viewed on the other site: `{path}` stands for the address of this page without the host
 * (`<a href="https://old.example.com{path}">`)
 */
export const substituteNoticePath = (html: string, path: string): string => html.split('{path}').join(escapeHtml(path));
