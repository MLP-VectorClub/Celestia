import { describe, expect, it } from 'vitest';

import { absoluteUrl, breadcrumbListJsonLd, serializeJsonLd } from 'src/utils/structured-data';

describe('breadcrumbListJsonLd', () => {
  it('numbers the entries from 1 and gives linked ones their whole address', () => {
    const data = breadcrumbListJsonLd(
      [{ name: 'Color Guide', href: '/cg' }, { name: 'Pony', href: { pathname: '/cg/pony', query: { q: 'a b' } } }, { name: 'Twilight' }],
      '/cg/pony/twilight'
    );
    expect(data['@context']).toBe('https://schema.org');
    expect(data['@type']).toBe('BreadcrumbList');
    expect(data.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Color Guide', item: expect.stringMatching(/\/cg$/) },
      { '@type': 'ListItem', position: 2, name: 'Pony', item: expect.stringMatching(/\/cg\/pony\?q=a\+b$/) },
      { '@type': 'ListItem', position: 3, name: 'Twilight', item: expect.stringMatching(/\/cg\/pony\/twilight$/) },
    ]);
  });

  it('drops label-only entries before the last, which has no address without a fallback', () => {
    const data = breadcrumbListJsonLd([{ name: 'Label' }, { name: 'Home', href: '/' }, { name: 'Here' }]);
    expect(data.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Home', item: expect.any(String) },
      { '@type': 'ListItem', position: 2, name: 'Here' },
    ]);
  });

  it('leaves addresses that are already whole alone', () => {
    expect(absoluteUrl('https://example.com/x')).toBe('https://example.com/x');
    expect(absoluteUrl('//example.com/x')).toBe('//example.com/x');
  });

  it('cannot be used to close the script tag early', () => {
    const json = serializeJsonLd(breadcrumbListJsonLd([{ name: '</script><script>alert(1)</script>' }]));
    expect(json).not.toContain('<');
    expect(JSON.parse(json).itemListElement[0].name).toBe('</script><script>alert(1)</script>');
  });
});
