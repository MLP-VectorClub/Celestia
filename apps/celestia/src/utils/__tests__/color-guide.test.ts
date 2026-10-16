import { describe, expect, it } from 'vitest';

import { RgbColors } from 'src/types/sprite-generator';
import { convertNumberToRgb, convertRgbToNumber, formatRgb, getSwatchStyle, hexToRgb, stringifyRgbNumber } from 'src/utils/color-guide';

describe('convertNumberToRgb', () => {
  const testNumber = (sourceNumber: number, expected: RgbColors) => {
    const result: RgbColors = convertNumberToRgb(sourceNumber);
    expect(result).toEqual(expected);
  };

  it('should convert number to rgb object', () => {
    testNumber(0xffffff, { red: 0xff, green: 0xff, blue: 0xff });
    testNumber(0x808080, { red: 0x80, green: 0x80, blue: 0x80 });
    testNumber(0x0000a0, { red: 0, green: 0, blue: 0xa0 });
    testNumber(0x00a000, { red: 0, green: 0xa0, blue: 0 });
    testNumber(0xa00000, { red: 0xa0, green: 0, blue: 0 });
    testNumber(0, { red: 0, green: 0, blue: 0 });
    testNumber(0x6181b8, { red: 0x61, green: 0x81, blue: 0xb8 });
  });
});

describe('convertRgbToNumber', () => {
  const testValues = (red: number, green: number, blue: number, expected: number) => {
    const result: number = convertRgbToNumber(red, green, blue);
    expect(result).toEqual(expected);
  };

  it('should convert individual rgb values to a number', () => {
    testValues(0xff, 0xff, 0xff, 0xffffff);
    testValues(0x80, 0x80, 0x80, 0x808080);
    testValues(0, 0, 0xa0, 0x0000a0);
    testValues(0, 0xa0, 0, 0x00a000);
    testValues(0xa0, 0, 0, 0xa00000);
    testValues(0, 0, 0, 0);
    testValues(0x61, 0x81, 0xb8, 0x6181b8);
  });
});

describe('stringifyRgbNumber', () => {
  const testNumber = (rgb: number, expected: string) => {
    const result: string = stringifyRgbNumber(rgb);
    expect(result).toEqual(expected);
  };

  it('should convert rgb values to a number', () => {
    testNumber(0xffffff, '#FFFFFF');
    testNumber(0x808080, '#808080');
    testNumber(0xa0, '#0000A0');
    testNumber(0xa000, '#00A000');
    testNumber(0xa00000, '#A00000');
    testNumber(0, '#000000');
    testNumber(0x6181b8, '#6181B8');
  });
});

describe('hexToRgb', () => {
  const testString = (sourceString: string, expected: ReturnType<typeof hexToRgb>) => {
    const result = hexToRgb(sourceString);
    expect(result).toEqual(expected);
  };

  it('should convert hex string to rgb object', () => {
    testString('#ffffff', { red: 0xff, green: 0xff, blue: 0xff });
    testString('#808080', { red: 0x80, green: 0x80, blue: 0x80 });
    testString('#0000a0', { red: 0, green: 0, blue: 0xa0 });
    testString('#00a000', { red: 0, green: 0xa0, blue: 0 });
    testString('#a00000', { red: 0xa0, green: 0, blue: 0 });
    testString('#000000', { red: 0, green: 0, blue: 0 });
    testString('#6181b8', { red: 0x61, green: 0x81, blue: 0xb8 });
  });

  it('should return null fort invalid values', () => {
    testString('kappa', null);
    testString('whatevenis', null);
    testString('nello there', null);
    testString('general kenobi', null);
    testString('dQw4w9WgXcQ', null);
    testString('ab', null);
    testString('abcd', null);
    testString('abcdf', null);
  });
});

describe('getSwatchStyle', () => {
  it('fills opaque colors', () => {
    expect(getSwatchStyle('#112233')).toEqual({ backgroundColor: '#112233' });
    expect(getSwatchStyle('#112233', null, 'overlay')).toEqual({ backgroundColor: '#112233' });
    expect(getSwatchStyle(null, 50)).toEqual({ backgroundColor: undefined });
  });

  it('splits semi-transparent colors: the color itself in the upper left, its opacity and blend mode over the grid in the lower right', () => {
    const style = getSwatchStyle('#112233', 40, 'overlay');

    expect(style.backgroundImage).toBe(
      "linear-gradient(to bottom right, #112233 0 50%, transparent 50% 100%), linear-gradient(to bottom right, transparent 0 50%, rgba(17, 34, 51, 0.4) 50% 100%), url('/img/transparency.svg')"
    );
    expect(style.backgroundBlendMode).toBe('normal, overlay, normal');
  });

  it('blends normally unless said otherwise', () => {
    expect(getSwatchStyle('#112233', 40).backgroundBlendMode).toBe('normal, normal, normal');
  });
});

describe('formatRgb', () => {
  it('writes rgb() for opaque colors and rgba() for semi-transparent ones', () => {
    expect(formatRgb({ red: 1, green: 2, blue: 3 })).toBe('rgb(1, 2, 3)');
    expect(formatRgb({ red: 1, green: 2, blue: 3 }, null)).toBe('rgb(1, 2, 3)');
    expect(formatRgb({ red: 1, green: 2, blue: 3 }, 40)).toBe('rgba(1, 2, 3, 0.4)');
  });
});
