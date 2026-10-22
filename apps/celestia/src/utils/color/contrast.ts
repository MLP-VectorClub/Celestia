import { Rgb } from 'src/utils/color/rgb';

/** A color with transparency; `alpha` is 0–1 */
export interface Rgba extends Rgb {
  alpha: number;
}

/** WCAG 2 AA: normal text, and large text / UI components (borders, focus rings) */
export const WCAG_AA_TEXT = 4.5;
export const WCAG_AA_LARGE = 3;

const linear = (channel: number) => {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

/** WCAG relative luminance, 0 (black) to 1 (white) */
export const relativeLuminance = ({ red, green, blue }: Rgb): number =>
  0.2126 * linear(red) + 0.7152 * linear(green) + 0.0722 * linear(blue);

/** WCAG contrast ratio, 1 to 21, whichever color is the lighter one */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const [la, lb] = [relativeLuminance(a), relativeLuminance(b)];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** What shows when `top` is laid over the opaque `bottom`; channels are not rounded so ratios stay exact */
export const compositeOver = (top: Rgba, bottom: Rgb): Rgb => ({
  red: top.red * top.alpha + bottom.red * (1 - top.alpha),
  green: top.green * top.alpha + bottom.green * (1 - top.alpha),
  blue: top.blue * top.alpha + bottom.blue * (1 - top.alpha),
});

const RGBA_PATTERN = /^rgba?\(\s*([\d.]+%?)[\s,]+([\d.]+%?)[\s,]+([\d.]+%?)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/i;
const channel = (text: string) => (text.endsWith('%') ? (parseFloat(text) / 100) * 255 : Number(text));

/** Reads `#rgb`, `#rrggbb` or `rgb()` / `rgba()`, channels as numbers or percentages (what `getComputedStyle` and Sass return); anything else is `null` */
export function parseRgba(text: string): Rgba | null {
  const value = text.trim();
  const hex = /^#([\da-f]{3}|[\da-f]{6})$/i.exec(value);
  if (hex) {
    const digits = hex[1].length === 3 ? [...hex[1]].map((d) => d + d).join('') : hex[1];
    return {
      red: parseInt(digits.slice(0, 2), 16),
      green: parseInt(digits.slice(2, 4), 16),
      blue: parseInt(digits.slice(4, 6), 16),
      alpha: 1,
    };
  }
  const match = RGBA_PATTERN.exec(value);
  if (!match) return null;
  const [red, green, blue] = match.slice(1, 4).map(channel);
  const alphaText = match[4];
  const alpha = alphaText === undefined ? 1 : alphaText.endsWith('%') ? parseFloat(alphaText) / 100 : Number(alphaText);
  if ([red, green, blue].some((n) => n > 255) || alpha < 0 || alpha > 1) return null;
  return { red, green, blue, alpha };
}
