export interface Levels {
  /** Input value shown as black, 0–254 */
  low: number;
  /** Input value shown as white, 1–255 and above `low` */
  high: number;
}

export const FULL_LEVELS: Levels = { low: 0, high: 255 };

export const isFullRange = ({ low, high }: Levels): boolean => low === 0 && high === 255;

/** Keeps both ends inside 0–255 with at least one step between them */
export function normalizeLevels({ low, high }: Levels): Levels {
  const newLow = Math.min(254, Math.max(0, Math.round(low) || 0));
  const newHigh = Math.min(255, Math.max(newLow + 1, Math.round(high) || 255));
  return { low: newLow, high: newHigh };
}

/** Maps every input value to the stretched output value */
export function levelsLookupTable(levels: Levels): Uint8ClampedArray<ArrayBuffer> {
  const { low, high } = normalizeLevels(levels);
  const table = new Uint8ClampedArray(256);
  for (let value = 0; value < 256; value++) table[value] = Math.round(((value - low) / (high - low)) * 255);
  return table;
}

/** New RGBA bytes with the levels applied to the color channels, opacity is kept. Only for display, never for readings */
export function applyLevels(data: ArrayLike<number>, levels: Levels): Uint8ClampedArray<ArrayBuffer> {
  const table = levelsLookupTable(levels);
  const result = new Uint8ClampedArray(data.length);
  for (let i = 0; i < data.length; i += 4) {
    result[i] = table[data[i]];
    result[i + 1] = table[data[i + 1]];
    result[i + 2] = table[data[i + 2]];
    result[i + 3] = data[i + 3];
  }
  return result;
}
