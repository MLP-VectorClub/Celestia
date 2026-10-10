import { describe, expect, it } from 'vitest';

import { SlimGuideTag } from '@mlp-vectorclub/api-types';
import {
  CutieMarkColorMapping,
  getAppearanceTitle,
  getColorMapping,
  getGuideLabel,
  getGuideTitle,
  getNonObviousCharacterTags,
  getSpriteUrl,
  hexToRgb,
  isGuideName,
  isValidFullListSortOption,
  resolveGuideName,
  scaleResize,
  sortTagsByType,
  stringifyRgbKey,
  yiq,
} from 'src/utils/color-guide';

describe('guide names', () => {
  it('knows the two guides', () => {
    expect(isGuideName('pony')).toBe(true);
    expect(isGuideName('eqg')).toBe(true);
    expect(isGuideName('pl')).toBe(false);
    expect(isGuideName(undefined)).toBe(false);
  });

  it('resolves only valid names', () => {
    expect(resolveGuideName('eqg')).toBe('eqg');
    expect(resolveGuideName('nope')).toBeUndefined();
    expect(resolveGuideName(['pony'])).toBeUndefined();
  });

  it('labels and titles', () => {
    expect(getGuideLabel('pony')).toBe('Friendship is Magic');
    expect(getGuideTitle('eqg')).toBe('Equestria Girls Color Guide');
    expect(getGuideTitle('pony', 2)).toBe('Page 2 - Friendship is Magic Color Guide');
    expect(getGuideTitle('pony', 2, 'twilight')).toBe('twilight - Page 2 - Friendship is Magic Color Guide');
    expect(getAppearanceTitle('pony', { label: 'Twilight Sparkle' })).toBe('Twilight Sparkle - Friendship is Magic Color Guide');
    expect(getAppearanceTitle('pony')).toBe('Friendship is Magic Color Guide');
  });
});

describe('scaleResize', () => {
  it('scales by a factor', () => {
    expect(scaleResize(100, 50, 'scale', 2)).toEqual({ scale: 2, width: 200, height: 100 });
  });

  it('fits a width or a height keeping the ratio', () => {
    expect(scaleResize(200, 100, 'width', 100)).toEqual({ scale: 0.5, width: 100, height: 50 });
    expect(scaleResize(200, 100, 'height', 300)).toEqual({ scale: 3, width: 600, height: 300 });
  });

  it('refuses an unknown property', () => {
    expect(() => scaleResize(1, 1, 'depth' as never, 1)).toThrow();
  });
});

describe('full list sorting', () => {
  it('accepts the three sort fields only', () => {
    expect(['label', 'added', 'relevance'].every(isValidFullListSortOption)).toBe(true);
    expect(isValidFullListSortOption('random')).toBe(false);
    expect(isValidFullListSortOption(undefined)).toBe(false);
  });
});

describe('sortTagsByType', () => {
  const tag = (type: SlimGuideTag['type']): SlimGuideTag => ({ id: 1, name: 'x', type }) as SlimGuideTag;

  it('puts the types in the guide order and untyped tags last', () => {
    const sorted = [tag('warn'), tag(null), tag('char'), tag('app'), tag('gen'), tag('cat'), tag('spec')]
      .sort(sortTagsByType)
      .map((t) => t.type);
    expect(sorted).toEqual(['app', 'cat', 'char', 'gen', 'spec', 'warn', null]);
  });
});

describe('getNonObviousCharacterTags', () => {
  it('lists character tags the label does not mention', () => {
    const appearance = {
      label: 'Twilight Sparkle (Season 1)',
      tags: [
        { name: 'twilight sparkle', type: 'char' },
        { name: 'Princess Twilight', type: 'char' },
        { name: 'unicorn', type: 'spec' },
      ],
    } as never;
    expect(getNonObviousCharacterTags(appearance)).toEqual(['Princess Twilight']);
  });
});

describe('getSpriteUrl', () => {
  it('asks for the size and busts the cache with the hash', () => {
    expect(getSpriteUrl(5, { hash: 'abc' })).toMatch(/\/appearances\/5\/sprite\?size=300&hash=abc$/);
    expect(getSpriteUrl(5, { hash: 'abc' }, 600)).toMatch(/size=600&hash=abc$/);
  });
});

describe('colors', () => {
  it('reads hex values and rejects bad ones', () => {
    expect(hexToRgb('#ff8000')).toEqual({ red: 255, green: 128, blue: 0 });
    expect(hexToRgb('#fff')).toBeNull();
  });

  it('weighs green over blue like the old site', () => {
    expect(yiq({ red: 255, green: 255, blue: 255 })).toBe(255);
    expect(yiq({ red: 0, green: 0, blue: 0 })).toBe(0);
    expect(yiq({ red: 0, green: 255, blue: 0 })).toBeGreaterThan(yiq({ red: 0, green: 0, blue: 255 }));
  });

  it('stringifies a key through the map or as the number itself', () => {
    expect(stringifyRgbKey({ 7: { red: 255, green: 0, blue: 16 } }, 7)).toBe('#FF0010');
    expect(stringifyRgbKey(null, 0xabcdef)).toBe('#ABCDEF');
    expect(stringifyRgbKey({}, 0xf)).toBe('#00000F');
  });
});

describe('getColorMapping', () => {
  const defaults: CutieMarkColorMapping = {
    'Coat Outline': '#000001',
    'Coat Shadow Outline': '#000002',
    'Coat Fill': '#000003',
    'Coat Shadow Fill': '#000004',
    'Mane & Tail Outline': '#000005',
    'Mane & Tail Fill': '#000006',
  };
  const group = (label: string, colors: Array<[string, string | null]>) => ({
    label,
    colors: colors.map(([l, hex]) => ({ label: l, hex })),
  });

  it('keeps the defaults when nothing matches', () => {
    expect(getColorMapping([group('Eyes', [['Fill', '#123456']])] as never, defaults)).toEqual(defaults);
  });

  it('maps coat and mane colors by group and color label', () => {
    const result = getColorMapping(
      [
        group('Coat', [
          ['Outline', '#111111'],
          ['Fill', '#222222'],
          ['Ignored', null],
        ]),
        group('Mane & Tail (Season 1)', [['Fill', '#333333']]),
      ] as never,
      defaults
    );
    expect(result['Coat Outline']).toBe('#111111');
    expect(result['Coat Fill']).toBe('#222222');
    expect(result['Mane & Tail Fill']).toBe('#333333');
    // Without their own shadow colors the coat's are reused
    expect(result['Coat Shadow Outline']).toBe('#111111');
    expect(result['Coat Shadow Fill']).toBe('#222222');
    expect(result['Mane & Tail Outline']).toBe('#000005');
  });

  it('treats costume and dress groups as the coat, ignores trailing numbers and lets the first color win', () => {
    const result = getColorMapping(
      [
        group('Dress', [
          ['Fill', '#aaaaaa'],
          ['Fill 2', '#bbbbbb'],
        ]),
      ] as never,
      defaults
    );
    expect(result['Coat Fill']).toBe('#aaaaaa');
  });
});
