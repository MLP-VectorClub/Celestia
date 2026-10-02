import { Rgb } from 'src/utils/color/rgb';

export interface BlendingInput {
  /** First background and what the original color looks like blended over it */
  bg1: Rgb;
  blend1: Rgb;
  /** Second background (must differ from the first) and the blended result over it */
  bg2: Rgb;
  blend2: Rgb;
}

export interface BlendingResult {
  /** The most likely original color, channels rounded */
  color: Rgb;
  /** 0–1, in steps of 1/255 */
  alpha: number;
  /** Remaining disagreement between the two backgrounds' results, 0 is a perfect match */
  delta: number;
}

/** Above this the two backgrounds disagree enough for the result to be unreliable */
export const MAX_RELIABLE_DELTA = 10;

/** Solves `blended = alpha * original + (1 - alpha) * background` for the original channel */
export const reverseComponent = (background: number, blended: number, alpha: number): number =>
  (blended - (1 - alpha) * background) / alpha;

const reverseRgb = (bg: Rgb, blend: Rgb, alpha: number): Rgb => ({
  red: reverseComponent(bg.red, blend.red, alpha),
  green: reverseComponent(bg.green, blend.green, alpha),
  blue: reverseComponent(bg.blue, blend.blue, alpha),
});

/**
 * Finds the original color and opacity that, blended over both backgrounds, gives the two blended colors: tries every opacity from 1/255
 * to 1 and keeps the one where both backgrounds imply the closest original color. `null` when the backgrounds are identical
 */
export function findOriginalColor({ bg1, blend1, bg2, blend2 }: BlendingInput): BlendingResult | null {
  if (bg1.red === bg2.red && bg1.green === bg2.green && bg1.blue === bg2.blue) return null;

  let best: { rgb: Rgb; alpha: number; delta: number } | null = null;
  for (let step = 1; step <= 255; step++) {
    const alpha = step / 255;
    const first = reverseRgb(bg1, blend1, alpha);
    const second = reverseRgb(bg2, blend2, alpha);
    const delta = Math.abs(first.red - second.red) + Math.abs(first.green - second.green) + Math.abs(first.blue - second.blue);
    if (best === null || delta < best.delta) best = { rgb: first, alpha, delta };
  }
  if (best === null) return null;

  return {
    color: { red: Math.round(best.rgb.red), green: Math.round(best.rgb.green), blue: Math.round(best.rgb.blue) },
    alpha: best.alpha,
    delta: best.delta,
  };
}
