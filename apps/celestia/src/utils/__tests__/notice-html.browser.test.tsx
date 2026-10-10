import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import { renderNoticeHtml } from 'src/utils/notice-html';

const renderHtml = (html: string) => render(<div data-testid="out">{renderNoticeHtml(html)}</div>);
const inner = async (html: string) => {
  const screen = await renderHtml(html);
  const result = screen.getByTestId('out').element().innerHTML;
  await screen.unmount();
  return result;
};

describe('renderNoticeHtml', () => {
  it('keeps the small set of inline tags', async () => {
    expect(await inner('<b>a</b> <strong>b</strong> <i>c</i> <em>d</em> <u>e</u> <code>f</code> <small>g</small>')).toBe(
      '<b>a</b> <strong>b</strong> <i>c</i> <em>d</em> <u>e</u> <code>f</code> <small>g</small>'
    );
    expect(await inner('one<br>two')).toBe('one<br>two');
  });

  it('opens web links in a new tab without leaking the opener', async () => {
    const screen = await renderHtml('<a href="https://example.com/x">link</a>');
    const link = screen.getByRole('link', { name: 'link' });
    await expect.element(link).toHaveAttribute('href', 'https://example.com/x');
    await expect.element(link).toHaveAttribute('target', '_blank');
    await expect.element(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('keeps links on the site in the same tab', async () => {
    const screen = await renderHtml('<a href="/cg/pony">guide</a>');
    const link = screen.getByRole('link', { name: 'guide' });
    await expect.element(link).toHaveAttribute('href', '/cg/pony');
    await expect.element(link).not.toHaveAttribute('target');
  });

  it.each(['javascript:alert(1)', '  JaVaScRiPt:alert(1)', '//evil.example/x', 'data:text/html,hi', 'mailto:a@b.c', ''])(
    'drops the link but keeps its text for %j',
    async (href) => {
      expect(await inner(`<a href="${href}">text</a>`)).toBe('text');
    }
  );

  it('drops a link without an address', async () => {
    expect(await inner('<a>text</a>')).toBe('text');
  });

  it('removes scripts and styles with their content, other tags only as wrappers', async () => {
    expect(await inner('a<script>alert(1)</script>b<style>p{}</style>c')).toBe('abc');
    expect(await inner('<div><p>keep <b>this</b></p></div>')).toBe('keep <b>this</b>');
  });

  it('strips attributes and event handlers from kept tags', async () => {
    expect(await inner('<b onclick="x()" style="color:red">bold</b>')).toBe('<b>bold</b>');
    expect(await inner('<img src="x" onerror="alert(1)">text')).toBe('text');
  });

  it('shows markup in text as text', async () => {
    expect(await inner('&lt;script&gt;alert(1)&lt;/script&gt;')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });
});
