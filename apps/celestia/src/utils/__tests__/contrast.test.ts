import { describe, expect, it } from 'vitest';

import { compositeOver, contrastRatio, parseRgba, relativeLuminance } from 'src/utils/color/contrast';

const BLACK = { red: 0, green: 0, blue: 0 };
const WHITE = { red: 255, green: 255, blue: 255 };

describe('contrastRatio', () => {
  it('is 21 for black on white, in either order', () => {
    expect(contrastRatio(BLACK, WHITE)).toBeCloseTo(21, 5);
    expect(contrastRatio(WHITE, BLACK)).toBeCloseTo(21, 5);
  });

  it('is 1 for identical colors', () => {
    expect(contrastRatio(WHITE, WHITE)).toBe(1);
  });

  it('matches known values (#767676 on white is the 4.54 AA threshold gray)', () => {
    expect(contrastRatio({ red: 0x76, green: 0x76, blue: 0x76 }, WHITE)).toBeCloseTo(4.54, 2);
  });
});

describe('relativeLuminance', () => {
  it('spans 0 to 1', () => {
    expect(relativeLuminance(BLACK)).toBe(0);
    expect(relativeLuminance(WHITE)).toBeCloseTo(1, 10);
  });
});

describe('compositeOver', () => {
  it('mixes by alpha', () => {
    expect(compositeOver({ ...WHITE, alpha: 0.5 }, BLACK)).toEqual({ red: 127.5, green: 127.5, blue: 127.5 });
    expect(compositeOver({ ...WHITE, alpha: 1 }, BLACK)).toEqual(WHITE);
    expect(compositeOver({ ...WHITE, alpha: 0 }, BLACK)).toEqual(BLACK);
  });
});

describe('parseRgba', () => {
  it('reads hex, rgb and rgba', () => {
    expect(parseRgba('#fff')).toEqual({ ...WHITE, alpha: 1 });
    expect(parseRgba('#1e3db3')).toEqual({ red: 30, green: 61, blue: 179, alpha: 1 });
    expect(parseRgba('rgb(1, 2, 3)')).toEqual({ red: 1, green: 2, blue: 3, alpha: 1 });
    expect(parseRgba('rgba(255, 255, 255, 0.75)')).toEqual({ ...WHITE, alpha: 0.75 });
    expect(parseRgba('rgb(255 255 255 / 50%)')).toEqual({ ...WHITE, alpha: 0.5 });
    expect(parseRgba('rgb(100%, 0%, 50%)')).toEqual({ red: 255, green: 0, blue: 127.5, alpha: 1 });
  });

  it('rejects anything else', () => {
    expect(parseRgba('red')).toBeNull();
    expect(parseRgba('rgb(300, 0, 0)')).toBeNull();
    expect(parseRgba('rgba(0, 0, 0, 2)')).toBeNull();
  });
});
