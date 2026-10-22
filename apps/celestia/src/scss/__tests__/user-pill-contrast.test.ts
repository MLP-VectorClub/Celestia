import path from 'node:path';
import postcss from 'postcss';
import * as sass from 'sass';
import { describe, expect, it } from 'vitest';

import { WCAG_AA_TEXT, compositeOver, contrastRatio, parseRgba } from 'src/utils/color/contrast';

import { compileApp } from './compile-app';

/**
 * The user pill (`UserLinkWithAvatar`, the reserver of a post and the small "local" one) has a pale background of its own in every theme, tinted
 * by the vector app, so its text has fixed dark colors. Axe cannot check the captions inside the app tinted pills (the app's icon is a pseudo
 * element over the pill), this checks every background the pill can have against both text colors.
 */
const appRoot = path.resolve(__dirname, '../../..');

const pillModule = postcss.parse(
  sass.compile(path.join(appRoot, 'src/scss/modules/UserLinkWithAvatar.module.scss'), {
    loadPaths: [path.join(appRoot, 'src'), path.join(appRoot, 'node_modules')],
    quietDeps: true,
    logger: sass.Logger.silent,
  }).css
);

const declaration = (root: postcss.Root, selector: RegExp, prop: string): string | undefined => {
  let value: string | undefined;
  root.walkRules(selector, (rule) => {
    rule.walkDecls(prop, (decl) => {
      value = decl.value;
    });
  });
  return value;
};

const color = (value: string | undefined) => {
  const parsed = parseRgba(value ?? '');
  if (!parsed) throw new Error(`Cannot read "${value}" as a color`);
  return parsed;
};

// Every pale background of a pill: the plain and local ones, and one per vector app (resting and hovered)
const backgrounds = (): string[] => {
  const found = new Set<string>();
  const take = (value: string | undefined) => {
    // `background: color.mix(...)` prints as one color, possibly followed by other layers
    const match = value && /(#[\da-f]{3,6}|rgba?\([^)]*\))/i.exec(value);
    if (match) found.add(match[1]);
  };
  take(declaration(pillModule, /^\.userLinkWithAvatar$/, 'background'));
  take(declaration(pillModule, /^\.userLinkWithAvatar\.local$/, 'background'));
  compileApp().walkRules(/\.da-userlink/, (rule) => {
    rule.walkDecls(/^background(-color)?$/, (decl) => take(decl.value));
  });
  return [...found];
};

describe('user pill text', { timeout: 30_000 }, () => {
  const text = color(declaration(pillModule, /^\.userLinkWithAvatar(,|$)/, 'color'));
  const caption = color(declaration(pillModule, /\.caption$/, 'color'));
  const pillBackgrounds = backgrounds();

  it('finds the plain, local and vector app backgrounds', () => {
    // plain, local, and the resting and hovered background of the three apps
    expect(pillBackgrounds.length).toBeGreaterThanOrEqual(5);
  });

  for (const [name, foreground] of [
    ['the name', text],
    ['the caption', caption],
  ] as const) {
    it(`${name} is at least ${WCAG_AA_TEXT}:1 on every pill background`, () => {
      const tooLow = pillBackgrounds
        .map((background) => ({ background, ratio: contrastRatio(compositeOver(foreground, { red: 255, green: 255, blue: 255 }), compositeOver(color(background), { red: 255, green: 255, blue: 255 })) }))
        .filter(({ ratio }) => ratio < WCAG_AA_TEXT);
      expect(tooLow).toEqual([]);
    });
  }
});
