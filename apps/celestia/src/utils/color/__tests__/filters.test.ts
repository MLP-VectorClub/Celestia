import { describe, expect, it } from 'vitest';

import { reverseChannel, solveFilter } from 'src/utils/color/filters';
import { reverseImageData } from 'src/utils/color/reverse-image';
import { Rgb } from 'src/utils/color/rgb';

const applyNormal = (alpha: number, top: Rgb, bottom: Rgb): Rgb => ({
  red: alpha * top.red + (1 - alpha) * bottom.red,
  green: alpha * top.green + (1 - alpha) * bottom.green,
  blue: alpha * top.blue + (1 - alpha) * bottom.blue,
});
const applyMultiply = (alpha: number, top: Rgb, bottom: Rgb): Rgb => ({
  red: alpha * ((top.red * bottom.red) / 255) + (1 - alpha) * bottom.red,
  green: alpha * ((top.green * bottom.green) / 255) + (1 - alpha) * bottom.green,
  blue: alpha * ((top.blue * bottom.blue) / 255) + (1 - alpha) * bottom.blue,
});

const originals: Rgb[] = [
  { red: 255, green: 255, blue: 255 },
  { red: 100, green: 200, blue: 50 },
  { red: 30, green: 60, blue: 240 },
];

describe('reverseChannel', () => {
  it('undoes a normal blend', () => {
    expect(
      reverseChannel('normal', 0.5, 200, applyNormal(0.5, { red: 200, green: 0, blue: 0 }, { red: 100, green: 0, blue: 0 }).red)
    ).toBeCloseTo(100);
  });

  it('undoes a multiply blend', () => {
    const filtered = applyMultiply(0.6, { red: 200, green: 120, blue: 60 }, { red: 100, green: 200, blue: 50 });
    expect(reverseChannel('multiply', 0.6, 200, filtered.red)).toBeCloseTo(100);
    expect(reverseChannel('multiply', 0.6, 120, filtered.green)).toBeCloseTo(200);
    expect(reverseChannel('multiply', 0.6, 60, filtered.blue)).toBeCloseTo(50);
  });
});

describe('solveFilter', () => {
  it('finds a normal filter from known pairs', () => {
    const top = { red: 20, green: 140, blue: 200 };
    const filtered = originals.map((o) => applyNormal(0.4, top, o));
    const result = solveFilter('normal', originals, filtered);
    expect(result.alpha).toBeCloseTo(0.4, 1);
    expect(Math.abs(result.red - top.red)).toBeLessThanOrEqual(3);
    expect(Math.abs(result.green - top.green)).toBeLessThanOrEqual(3);
    expect(Math.abs(result.blue - top.blue)).toBeLessThanOrEqual(3);
  });

  it('finds a multiply filter that restores the originals when reversed', () => {
    const filtered = originals.map((o) => applyMultiply(0.6, { red: 200, green: 120, blue: 60 }, o));
    const filter = solveFilter('multiply', originals, filtered);
    originals.forEach((original, i) => {
      expect(reverseChannel('multiply', filter.alpha, filter.red, filtered[i].red)).toBeCloseTo(original.red, -1);
      expect(reverseChannel('multiply', filter.alpha, filter.green, filtered[i].green)).toBeCloseTo(original.green, -1);
      expect(reverseChannel('multiply', filter.alpha, filter.blue, filtered[i].blue)).toBeCloseTo(original.blue, -1);
    });
  });

  it('does not produce NaN when all pairs are identical', () => {
    const same = [
      { red: 10, green: 10, blue: 10 },
      { red: 10, green: 10, blue: 10 },
    ];
    expect(Number.isNaN(solveFilter('normal', same, same).alpha)).toBe(false);
  });
});

describe('reverseImageData', () => {
  const overlay = { red: 255, green: 0, blue: 255, alpha: 0.5 };

  it('restores pixels, keeps alpha and flags nothing when everything fits', () => {
    const filter = { red: 0, green: 0, blue: 0, alpha: 0.5 };
    const pixel = applyNormal(0.5, filter, { red: 100, green: 80, blue: 60 });
    const { image, overlay: flags } = reverseImageData([pixel.red, pixel.green, pixel.blue, 200], {
      type: 'normal',
      filter,
      sensitivity: 0,
      overlay,
    });
    expect(Array.from(image)).toEqual([100, 80, 60, 200]);
    expect(Array.from(flags)).toEqual([0, 0, 0, 0]);
  });

  it('flags pixels that cannot be restored and clamps them', () => {
    const filter = { red: 255, green: 255, blue: 255, alpha: 0.5 };
    const { image, overlay: flags } = reverseImageData([0, 0, 0, 255], { type: 'normal', filter, sensitivity: 0, overlay });
    expect(Array.from(image)).toEqual([0, 0, 0, 255]);
    expect(Array.from(flags)).toEqual([255, 0, 255, 128]);
  });

  it('tolerates small overshoots up to the sensitivity', () => {
    const filter = { red: 255, green: 255, blue: 255, alpha: 0.1 };
    // restored = (0 - 25.5) / 0.9 = -28.3
    expect(reverseImageData([0, 0, 0, 255], { type: 'normal', filter, sensitivity: 30, overlay }).overlay[3]).toBe(0);
    expect(reverseImageData([0, 0, 0, 255], { type: 'normal', filter, sensitivity: 20, overlay }).overlay[3]).toBe(128);
  });
});
