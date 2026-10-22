import { Rule } from 'postcss';
import { describe, expect, it } from 'vitest';

import { Rgba, WCAG_AA_TEXT, compositeOver, contrastRatio, parseRgba } from 'src/utils/color/contrast';

import { compileApp, rulesOutsideMedia } from './compile-app';

type Theme = 'light' | 'dark';

const rules = rulesOutsideMedia(compileApp());
const declarations = (rule: Rule) => {
  const found: Record<string, string> = {};
  rule.walkDecls((decl) => {
    found[decl.prop] = decl.value;
  });
  return found;
};
const isLightRoot = (selector: string) => /^:root(,\s*\[data-bs-theme=["']?light["']?\])?$/.test(selector) || selector === '[data-bs-theme="light"]';
const isDarkRoot = (selector: string) => /^\[data-bs-theme=["']?dark["']?\]$/.test(selector);

/** Every custom property that holds for a theme, the way the cascade on <html> settles them */
const properties = (theme: Theme): Record<string, string> => {
  const result: Record<string, string> = {};
  for (const rule of rules) {
    if (isLightRoot(rule.selector) || (theme === 'dark' && isDarkRoot(rule.selector))) {
      for (const [prop, value] of Object.entries(declarations(rule))) if (prop.startsWith('--')) result[prop] = value;
    }
  }
  return result;
};

/** A color given as a literal or `var(--name)`, with the theme's values filled in */
const resolve = (theme: Theme, value: string): Rgba => {
  const props = properties(theme);
  let text = value.trim();
  for (let depth = 0; depth < 5; depth++) {
    const variable = /^var\((--[\w-]+)\)$/.exec(text);
    if (!variable) break;
    text = props[variable[1]] ?? '';
  }
  const color = parseRgba(text);
  if (!color) throw new Error(`Cannot read "${value}" as a color for the ${theme} theme (got "${text}")`);
  return color;
};

/** What a color looks like on top of the given layers (bottom first) */
const onTop = (theme: Theme, color: string, ...layers: string[]) => {
  const background = layers.map((layer) => resolve(theme, layer)).reduce((below, layer) => compositeOver(layer, below), { red: 0, green: 0, blue: 0 });
  const foreground = resolve(theme, color);
  return { foreground: compositeOver(foreground, background), background };
};

const ratio = (theme: Theme, color: string, ...layers: string[]) => {
  const { foreground, background } = onTop(theme, color, ...layers);
  return contrastRatio(foreground, background);
};

const PANEL = ['var(--mlpvc-main-bg)', 'var(--mlpvc-content-bg)'];

describe.each<Theme>(['light', 'dark'])('%s theme contrast (WCAG AA)', (theme) => {
  const text = (name: string, color: string, ...layers: string[]) =>
    it(`${name} is at least ${WCAG_AA_TEXT}:1`, () => expect(ratio(theme, color, ...layers)).toBeGreaterThanOrEqual(WCAG_AA_TEXT));

  describe('the content panel', () => {
    text('body text', 'var(--bs-body-color)', ...PANEL);
    text('emphasized text', 'var(--bs-emphasis-color)', ...PANEL);
    text('muted text', 'var(--bs-secondary-color)', ...PANEL);
    text('links', 'var(--bs-link-color)', ...PANEL);
    text('hovered links', 'var(--bs-link-hover-color)', ...PANEL);
    text('inline code', 'var(--bs-code-color)', ...PANEL);
    text('valid feedback', 'var(--bs-form-valid-color)', ...PANEL);
    text('invalid feedback', 'var(--bs-form-invalid-color)', ...PANEL);
  });

  describe('the page', () => {
    text('body text on the page background', 'var(--bs-body-color)', 'var(--bs-body-bg)');
    text('muted text, body text at 75% (the cards of the full list), on the page background', 'var(--bs-secondary-color)', 'var(--bs-body-bg)');
    text('white header text on the header', '#fff', 'var(--mlpvc-header)');
    text('white text on the sidebar, footer and breadcrumbs', '#fff', 'var(--mlpvc-chrome)');
    text('sidebar text (white at 75%) on the sidebar', 'rgba(255, 255, 255, 0.75)', 'var(--mlpvc-chrome)');
  });

  describe('the header and footer', () => {
    // They are the header color at 88% (`fluid-background`) over whatever scrolls under them, at worst white
    const WHITE = '#fff';
    const translucent = (name: string, color: string) =>
      it(`${name} is at least ${WCAG_AA_TEXT}:1 over the lightest backdrop`, () => {
        const header = resolve(theme, color);
        const background = compositeOver({ ...header, alpha: 0.88 }, { red: 255, green: 255, blue: 255 });
        expect(contrastRatio(resolve(theme, WHITE), background)).toBeGreaterThanOrEqual(WCAG_AA_TEXT);
      });
    translucent('white text on the header and footer', 'var(--mlpvc-header)');
  });

  describe('theme colors as text', () => {
    // Outline buttons, `.text-*` and the colored dialogs put each theme color on the page background
    const colors = Object.keys(properties(theme))
      .filter((prop) => /^--mlpvc-[\w-]+-text$/.test(prop) && !/--mlpvc-text-/.test(prop))
      .map((prop) => prop.replace(/^--mlpvc-/, '').replace(/-text$/, ''));

    it('finds the theme colors', () => expect(colors.length).toBeGreaterThan(10));
    for (const color of colors) {
      text(`${color}`, `var(--mlpvc-${color}-text)`, 'var(--bs-body-bg)');
    }
    for (const accent of ['blue', 'orange', 'green', 'ui', 'darkblue', 'red', 'brown']) {
      text(`the ${accent} accent`, `var(--mlpvc-text-${accent})`, ...PANEL);
    }
  });

  describe('theme colored alerts', () => {
    for (const color of ['primary', 'secondary', 'success', 'info', 'warning', 'danger']) {
      text(`${color} alert text`, `var(--bs-${color}-text-emphasis)`, `var(--bs-${color}-bg-subtle)`);
    }
  });
});
