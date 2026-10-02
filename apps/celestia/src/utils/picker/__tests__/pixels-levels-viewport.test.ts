import { describe, expect, it } from 'vitest';

import { applyLevels, levelsLookupTable, normalizeLevels } from 'src/utils/picker/levels';
import { averageColor, formatColor, formatPercent, pixelAtPosition } from 'src/utils/picker/pixels';
import {
  ZOOM,
  centeredViewport,
  fitZoom,
  formatZoom,
  imageToView,
  parseZoomPercent,
  pixelAt,
  stepZoom,
  viewToImage,
  zoomAround,
} from 'src/utils/picker/viewport';

describe('averageColor', () => {
  it('is null without pixels', () => {
    expect(averageColor([])).toBeNull();
  });

  it('rounds the channels and keeps the exact mean opacity', () => {
    const avg = averageColor([
      { red: 10, green: 20, blue: 30, alpha: 1 },
      { red: 11, green: 20, blue: 31, alpha: 0 },
    ]);
    expect(avg).toEqual({ red: 11, green: 20, blue: 31, alpha: 0.5 });
  });
});

describe('formatting', () => {
  it('shows the opacity only when not fully opaque', () => {
    expect(formatColor({ red: 255, green: 165, blue: 0, alpha: 1 })).toBe('#ffa500');
    expect(formatColor({ red: 0, green: 0, blue: 0, alpha: 0.12345 })).toBe('#000000 @ 12.35%');
  });

  it('rounds percentages to two decimals', () => {
    expect(formatPercent(0.5)).toBe(50);
    expect(formatPercent(1 / 3)).toBe(33.33);
  });
});

describe('levels', () => {
  it('keeps low below high and inside 0–255', () => {
    expect(normalizeLevels({ low: 300, high: 10 })).toEqual({ low: 254, high: 255 });
    expect(normalizeLevels({ low: -5, high: 400 })).toEqual({ low: 0, high: 255 });
  });

  it('stretches the range', () => {
    const table = levelsLookupTable({ low: 50, high: 150 });
    expect([table[0], table[50], table[100], table[150], table[255]]).toEqual([0, 0, 128, 255, 255]);
  });

  it('leaves opacity alone and does not touch the input', () => {
    const input = [100, 50, 200, 77];
    const out = applyLevels(input, { low: 50, high: 150 });
    expect(Array.from(out)).toEqual([128, 0, 255, 77]);
    expect(input).toEqual([100, 50, 200, 77]);
  });
});

describe('viewport', () => {
  const image = { width: 200, height: 100 };
  const view = { width: 400, height: 400 };

  it('fits the image inside the view and centers it', () => {
    const zoom = fitZoom(image, view);
    expect(zoom).toBe(2);
    expect(centeredViewport(image, view, zoom)).toEqual({ zoom: 2, offsetX: 0, offsetY: 100 });
  });

  it('limits zoom', () => {
    expect(stepZoom(ZOOM.max, 1)).toBe(ZOOM.max);
    expect(stepZoom(ZOOM.min, -1)).toBe(ZOOM.min);
    expect(stepZoom(1, 1)).toBeCloseTo(1.1);
  });

  it('keeps the point under the anchor fixed while zooming', () => {
    const viewport = { zoom: 1, offsetX: 30, offsetY: 40 };
    const anchor = { x: 130, y: 90 };
    const before = viewToImage(viewport, anchor);
    const zoomed = zoomAround(viewport, 4, anchor);
    expect(zoomed.zoom).toBe(4);
    const after = viewToImage(zoomed, anchor);
    expect(after.x).toBeCloseTo(before.x);
    expect(after.y).toBeCloseTo(before.y);
  });

  it('converts both ways', () => {
    const viewport = { zoom: 2, offsetX: 10, offsetY: 20 };
    expect(imageToView(viewport, viewToImage(viewport, { x: 50, y: 60 }))).toEqual({ x: 50, y: 60 });
  });

  it('finds the whole pixel under the pointer or nothing outside the image', () => {
    const viewport = { zoom: 2, offsetX: 10, offsetY: 10 };
    expect(pixelAt(viewport, image, { x: 15, y: 31 })).toEqual({ x: 2, y: 10 });
    expect(pixelAt(viewport, image, { x: 5, y: 31 })).toBeNull();
    expect(pixelAt(viewport, image, { x: 500, y: 31 })).toBeNull();
  });
});

describe('zoom text', () => {
  it('formats zoom factors as percentages', () => {
    expect(formatZoom(1)).toBe('100%');
    expect(formatZoom(0.004)).toBe('0.4%');
    expect(formatZoom(1.255)).toBe('125.5%');
  });

  it('reads typed percentages within the zoom range', () => {
    expect(parseZoomPercent('150')).toBe(1.5);
    expect(parseZoomPercent(' 12.5 % ')).toBe(0.125);
    expect(parseZoomPercent('0.1')).toBe(ZOOM.min);
    expect(parseZoomPercent('999999')).toBe(ZOOM.max);
  });

  it('rejects anything that is not a positive number', () => {
    ['', 'abc', '-5', '0', '1e3', '10px'].forEach((text) => expect(parseZoomPercent(text)).toBeNull());
  });
});

describe('pixelAtPosition', () => {
  const data = [1, 2, 3, 255, 4, 5, 6, 0];

  it('reads a pixel with opacity as 0–1', () => {
    expect(pixelAtPosition(data, 2, 1, 1, 0)).toEqual({ red: 4, green: 5, blue: 6, alpha: 0 });
    expect(pixelAtPosition(data, 2, 1, 0, 0)).toEqual({ red: 1, green: 2, blue: 3, alpha: 1 });
  });

  it('is null outside the image', () => {
    expect(pixelAtPosition(data, 2, 1, 2, 0)).toBeNull();
    expect(pixelAtPosition(data, 2, 1, 0, -1)).toBeNull();
  });
});
