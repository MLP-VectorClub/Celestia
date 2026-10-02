import { rgbToHex } from 'src/utils/color';

export interface Pixel {
  red: number;
  green: number;
  blue: number;
  /** 0–1 */
  alpha: number;
}

/**
 * Mean of the pixels' channels. Channels are rounded to whole numbers, the opacity is the exact mean (0–1) so partly transparent areas
 * report a real opacity. `null` for no pixels
 */
export function averageColor(pixels: Pixel[]): Pixel | null {
  if (pixels.length === 0) return null;
  let red = 0;
  let green = 0;
  let blue = 0;
  let alpha = 0;
  pixels.forEach((pixel) => {
    red += pixel.red;
    green += pixel.green;
    blue += pixel.blue;
    alpha += pixel.alpha;
  });
  const count = pixels.length;
  return { red: Math.round(red / count), green: Math.round(green / count), blue: Math.round(blue / count), alpha: alpha / count };
}

/** Percentage with at most two decimals, `0.5` becomes `50` and `0.12345` becomes `12.35` */
export const formatPercent = (fraction: number): number => Math.round(fraction * 10000) / 100;

/** `#aabbcc`, followed by ` @ 50%` when the color is not fully opaque */
export function formatColor(pixel: Pixel): string {
  const hex = rgbToHex(pixel);
  return pixel.alpha === 1 ? hex : `${hex} @ ${formatPercent(pixel.alpha)}%`;
}

/** `rgba(1, 2, 3, 0.5)` for use as a CSS color */
export const toCssColor = ({ red, green, blue, alpha }: Pixel): string => `rgba(${red}, ${green}, ${blue}, ${alpha})`;

/** The pixel at (x, y) of RGBA data `width` pixels wide, `null` outside of it */
export function pixelAtPosition(data: ArrayLike<number>, width: number, height: number, x: number, y: number): Pixel | null {
  if (x < 0 || y < 0 || x >= width || y >= height) return null;
  const i = (y * width + x) * 4;
  return { red: data[i], green: data[i + 1], blue: data[i + 2], alpha: data[i + 3] / 255 };
}

/** `rgb(1, 2, 3)`, or `rgba(1, 2, 3, 0.5)` when not fully opaque */
export function formatRgb({ red, green, blue, alpha }: Pixel): string {
  const channels = `${red}, ${green}, ${blue}`;
  return alpha === 1 ? `rgb(${channels})` : `rgba(${channels}, ${Math.round(alpha * 10000) / 10000})`;
}
