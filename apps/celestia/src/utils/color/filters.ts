import { Rgb } from 'src/utils/color/rgb';

export type FilterType = 'normal' | 'multiply';

export interface Rgba extends Rgb {
  /** 0–1 */
  alpha: number;
}

const CHANNELS = ['red', 'green', 'blue'] as const;

export const clamp = (value: number, min: number, max: number): number => (Number.isNaN(value) ? min : Math.min(max, Math.max(min, value)));

/**
 * Undoes a filter layer on one color channel. `alpha` and `filterChannel` describe the filter, `pixel` is the filtered value and the
 * result is the original value (unclamped, can be infinite when the filter is fully opaque)
 *
 * - normal: `filtered = alpha * filter + (1 - alpha) * original`
 * - multiply: `filtered = alpha * filter * original / 255 + (1 - alpha) * original`
 */
export function reverseChannel(type: FilterType, alpha: number, filterChannel: number, pixel: number): number {
  if (type === 'multiply') return pixel / (1 - alpha * (1 - filterChannel / 255));
  return (pixel - alpha * filterChannel) / (1 - alpha);
}

function solveNormal(originals: Rgb[], filtered: Rgb[]): Rgba {
  const n = originals.length;
  const sumBase: Rgb = { red: 0, green: 0, blue: 0 };
  const sumDiff: Rgb = { red: 0, green: 0, blue: 0 };
  let numerator = 0;
  let denominator = 0;

  CHANNELS.forEach((channel) => {
    originals.forEach((color, index) => {
      const b = color[channel];
      const d = b - filtered[index][channel];
      sumBase[channel] += b;
      sumDiff[channel] += d;
      numerator -= n * d ** 2;
      denominator -= n * b * d;
    });
    numerator += sumDiff[channel] ** 2;
    denominator += sumDiff[channel] * sumBase[channel];
  });

  const alpha = denominator === 0 ? 0 : clamp(numerator / denominator, 0, 1);
  const channel = (key: (typeof CHANNELS)[number]) => Math.round(clamp(alpha ? (sumBase[key] - sumDiff[key] / alpha) / n : 0, 0, 255));
  return { red: channel('red'), green: channel('green'), blue: channel('blue'), alpha };
}

function solveMultiply(originals: Rgb[], filtered: Rgb[]): Rgba {
  const raw = {} as Record<(typeof CHANNELS)[number], number>;
  CHANNELS.forEach((channel) => {
    const numerator = originals.reduce((sum, b, i) => sum + b[channel] * (b[channel] - filtered[i][channel]), 0);
    const denominator = originals.reduce((sum, b, i) => sum + (b[channel] - filtered[i][channel]) ** 2, 0);
    raw[channel] = numerator / (denominator * 2);
  });

  // The pairs only fix the product of opacity and color, so the opacity is chosen as low as it can be while the color stays valid
  const smallest = Math.min(raw.red, raw.green, raw.blue);
  const kmin = Math.max(1, 1 / smallest);
  const channel = (key: (typeof CHANNELS)[number]) => Math.round(clamp(255 - 255 / (raw[key] * kmin), 0, 255));
  return { red: channel('red'), green: channel('green'), blue: channel('blue'), alpha: clamp(0.5 * kmin, 0, 1) };
}

/** Finds the filter color and opacity that best turns each original color into its filtered counterpart (needs at least two pairs) */
export function solveFilter(type: FilterType, originals: Rgb[], filtered: Rgb[]): Rgba {
  return type === 'multiply' ? solveMultiply(originals, filtered) : solveNormal(originals, filtered);
}
