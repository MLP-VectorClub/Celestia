import { describe, expect, it } from 'vitest';

import { areaAverageColor, overallAverage } from 'src/utils/picker/area-colors';
import { PickingArea } from 'src/utils/picker/areas';
import { formatRgb } from 'src/utils/picker/pixels';

/** 2×1 image: opaque red, then fully transparent blue */
const image = { width: 2, height: 1, data: [255, 0, 0, 255, 0, 0, 255, 0] };
const area = (over: Partial<PickingArea> = {}): PickingArea => ({ id: 1, shape: 'square', center: { x: 1, y: 0 }, size: 2, ...over });

describe('areaAverageColor', () => {
  it('averages the covered pixels including their opacity', () => {
    expect(areaAverageColor(area(), image)).toEqual({ red: 128, green: 0, blue: 128, alpha: 0.5 });
  });

  it('is null when the area is off the image and remembers the answer per area', () => {
    const outside = area({ center: { x: 50, y: 50 } });
    expect(areaAverageColor(outside, image)).toBeNull();
    // the cached value is returned even if different pixels are passed, areas are bound to one image
    expect(areaAverageColor(outside, { width: 100, height: 100, data: new Array(40000).fill(9) })).toBeNull();
  });
});

describe('overallAverage', () => {
  it('averages the readings and skips missing ones', () => {
    expect(overallAverage([{ red: 0, green: 0, blue: 0, alpha: 1 }, null, { red: 100, green: 50, blue: 10, alpha: 0 }])).toEqual({
      red: 50,
      green: 25,
      blue: 5,
      alpha: 0.5,
    });
  });

  it('is null without readings', () => {
    expect(overallAverage([])).toBeNull();
    expect(overallAverage([null])).toBeNull();
  });
});

describe('formatRgb', () => {
  it('writes rgb or rgba depending on the opacity', () => {
    expect(formatRgb({ red: 1, green: 2, blue: 3, alpha: 1 })).toBe('rgb(1, 2, 3)');
    expect(formatRgb({ red: 1, green: 2, blue: 3, alpha: 0.5 })).toBe('rgba(1, 2, 3, 0.5)');
  });
});
