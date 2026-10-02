import { describe, expect, it } from 'vitest';

import { PickingArea, areaBounds, areaContains, areaPixels, findAreaAt, reshapeArea, roundSlices } from 'src/utils/picker/areas';

const area = (over: Partial<PickingArea> = {}): PickingArea => ({ id: 1, shape: 'square', center: { x: 5, y: 5 }, size: 3, ...over });

/** width×height image where every pixel's red channel is its index, fully opaque */
const image = (width: number, height: number) => ({
  width,
  height,
  data: Array.from({ length: width * height * 4 }, (_, i) => (i % 4 === 0 ? Math.floor(i / 4) : i % 4 === 3 ? 255 : 0)),
});

describe('areaBounds', () => {
  it('centers odd sizes and puts the extra pixel of even sizes bottom right', () => {
    expect(areaBounds(area({ size: 3 }))).toEqual({ x: 4, y: 4, size: 3 });
    expect(areaBounds(area({ size: 4 }))).toEqual({ x: 3, y: 3, size: 4 });
  });
});

describe('roundSlices', () => {
  it('is a single pixel for diameter 1', () => {
    expect(roundSlices(1)).toEqual([{ skip: 0, length: 1 }]);
  });

  it('describes a symmetric disc', () => {
    const slices = roundSlices(5);
    expect(slices).toHaveLength(5);
    expect(slices[2]).toEqual({ skip: 0, length: 5 });
    // a row is centered: what is skipped on the left is missing on the right too
    slices.forEach((slice) => expect(slice.skip).toBe(5 - slice.skip - slice.length));
    expect(slices[0].length).toBeLessThan(slices[2].length);
    slices.forEach((s, i) => expect(s).toEqual(slices[4 - i]));
  });

  it('never has an empty row', () => {
    [2, 3, 10, 25, 400].forEach((d) => roundSlices(d).forEach((s) => expect(s.length).toBeGreaterThan(0)));
  });
});

describe('areaContains', () => {
  it('covers the whole square', () => {
    expect(areaContains(area(), 4, 4)).toBe(true);
    expect(areaContains(area(), 6, 6)).toBe(true);
    expect(areaContains(area(), 7, 5)).toBe(false);
  });

  it('leaves the corners of a round area out', () => {
    const round = area({ shape: 'round', size: 9, center: { x: 10, y: 10 } });
    expect(areaContains(round, 10, 10)).toBe(true);
    expect(areaContains(round, 6, 6)).toBe(false);
  });
});

describe('areaPixels', () => {
  it('reads every pixel of a square, with opacity as 0–1', () => {
    const pixels = areaPixels(area({ center: { x: 2, y: 2 }, size: 3 }), image(5, 5));
    expect(pixels).toHaveLength(9);
    expect(pixels.map((p) => p.red)).toEqual([6, 7, 8, 11, 12, 13, 16, 17, 18]);
    expect(pixels[0].alpha).toBe(1);
  });

  it('clips at the image edges without shifting the rest', () => {
    const pixels = areaPixels(area({ center: { x: 0, y: 0 }, size: 3 }), image(5, 5));
    expect(pixels.map((p) => p.red)).toEqual([0, 1, 5, 6]);
  });

  it('includes every pixel the circle covers, including the leftmost of each row', () => {
    const round = area({ shape: 'round', center: { x: 3, y: 3 }, size: 5 });
    const expected = roundSlices(5).reduce((sum, s) => sum + s.length, 0);
    expect(areaPixels(round, image(8, 8))).toHaveLength(expected);
    const first = areaPixels(round, image(8, 8))[0];
    // row 0 of the circle starts at its `skip`, which is the image's column 1 + skip
    expect(first.red).toBe(1 * 8 + (1 + roundSlices(5)[0].skip));
  });

  it('is empty when the area is outside the image', () => {
    expect(areaPixels(area({ center: { x: 50, y: 50 } }), image(5, 5))).toEqual([]);
  });
});

describe('findAreaAt', () => {
  it('prefers the area placed last', () => {
    const a = area({ id: 1 });
    const b = area({ id: 2 });
    expect(findAreaAt([a, b], 5, 5)?.id).toBe(2);
    expect(findAreaAt([a, b], 50, 50)).toBeUndefined();
  });
});

describe('reshapeArea', () => {
  it('changes size and shape, keeps the center and limits the size', () => {
    expect(reshapeArea(area(), { size: 10, shape: 'round' })).toEqual(area({ size: 10, shape: 'round' }));
    expect(reshapeArea(area(), { size: 5000 }).size).toBe(400);
    expect(reshapeArea(area(), { size: 0 }).size).toBe(1);
  });
});
