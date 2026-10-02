import { describe, expect, it } from 'vitest';

import { MAX_RELIABLE_DELTA, findOriginalColor } from 'src/utils/color/blending';
import { parseColor, rgbToHex } from 'src/utils/color/rgb';

describe('parseColor', () => {
  it('reads hex with and without the hash, short and long', () => {
    expect(parseColor('#FFA500')).toEqual({ red: 255, green: 165, blue: 0 });
    expect(parseColor('ffa500')).toEqual({ red: 255, green: 165, blue: 0 });
    expect(parseColor('#abc')).toEqual({ red: 170, green: 187, blue: 204 });
  });

  it('reads rgb() and ignores surrounding whitespace', () => {
    expect(parseColor(' rgb(1, 2,3) ')).toEqual({ red: 1, green: 2, blue: 3 });
  });

  it('rejects anything else', () => {
    expect(parseColor('')).toBeNull();
    expect(parseColor('#abcd')).toBeNull();
    expect(parseColor('rgb(256, 0, 0)')).toBeNull();
    expect(parseColor('red')).toBeNull();
  });
});

describe('rgbToHex', () => {
  it('pads, rounds and clamps', () => {
    expect(rgbToHex({ red: 0, green: 9.6, blue: 300 })).toBe('#000aff');
    expect(rgbToHex({ red: -5, green: 255, blue: 16 })).toBe('#00ff10');
  });
});

describe('findOriginalColor', () => {
  const blend = (c: number, bg: number, alpha: number) => Math.round(alpha * c + (1 - alpha) * bg);

  it('recovers a color blended at a known opacity over white and black', () => {
    const alpha = 0.5;
    const original = { red: 200, green: 100, blue: 40 };
    const result = findOriginalColor({
      bg1: { red: 255, green: 255, blue: 255 },
      blend1: { red: blend(200, 255, alpha), green: blend(100, 255, alpha), blue: blend(40, 255, alpha) },
      bg2: { red: 0, green: 0, blue: 0 },
      blend2: { red: blend(200, 0, alpha), green: blend(100, 0, alpha), blue: blend(40, 0, alpha) },
    });
    expect(result).not.toBeNull();
    expect(result!.alpha).toBeCloseTo(alpha, 1);
    expect(Math.abs(result!.color.red - original.red)).toBeLessThanOrEqual(3);
    expect(Math.abs(result!.color.green - original.green)).toBeLessThanOrEqual(3);
    expect(Math.abs(result!.color.blue - original.blue)).toBeLessThanOrEqual(3);
    expect(result!.delta).toBeLessThanOrEqual(MAX_RELIABLE_DELTA);
  });

  it('gives no result when both backgrounds are the same', () => {
    const same = { red: 10, green: 10, blue: 10 };
    expect(findOriginalColor({ bg1: same, blend1: same, bg2: { ...same }, blend2: same })).toBeNull();
  });
});
