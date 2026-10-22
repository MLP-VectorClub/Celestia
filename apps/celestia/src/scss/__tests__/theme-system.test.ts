import { describe, expect, it } from 'vitest';

import { compileApp, rulesInDarkMedia, rulesOutsideMedia } from './compile-app';

const DARK = /\[data-bs-theme=["']?dark["']?\]/;
const SYSTEM = ':root:not([data-bs-theme])';
// Bootstrap components this site does not use, so their dark rules are not repeated for the system theme (see _theme.scss)
// (the navbar rules are for `.navbar[data-bs-theme=dark]`, a dark navbar on a light page: the header is always dark and uses `.navbar-dark`)
const UNUSED = ['.carousel', '.accordion-button', '.navbar'];
const UNUSED_PROPS = ['--bs-carousel'];

// Compiling all of Bootstrap takes a few seconds, more on slow runners
describe('System theme', { timeout: 30_000 }, () => {
  const root = compileApp();
  const darkRules = rulesOutsideMedia(root).filter((rule) => DARK.test(rule.selector) && !UNUSED.some((name) => rule.selector.includes(name)));
  const systemRules = rulesInDarkMedia(root);

  it('finds the dark rules to compare', () => {
    expect(darkRules.length).toBeGreaterThan(2);
    expect(systemRules.length).toBeGreaterThan(2);
  });

  it('applies every dark declaration of [data-bs-theme=dark] when no theme is chosen', () => {
    const missing: string[] = [];
    for (const rule of darkRules) {
      const selector = rule.selector.replace(new RegExp(DARK.source, 'g'), SYSTEM);
      const mirrored = systemRules.filter((candidate) => candidate.selector === selector);
      rule.walkDecls((decl) => {
        if (UNUSED_PROPS.some((prefix) => decl.prop.startsWith(prefix))) return;
        const found = mirrored.some((candidate) => {
          let same = false;
          candidate.walkDecls(decl.prop, (other) => {
            if (other.value === decl.value) same = true;
          });
          return same;
        });
        if (!found) missing.push(`${rule.selector} { ${decl.prop}: ${decl.value} }`);
      });
    }
    expect(missing).toEqual([]);
  });

  it('only applies when the visitor has not chosen a theme', () => {
    for (const rule of systemRules) {
      expect(rule.selector, rule.selector).toContain(SYSTEM);
    }
  });
});
