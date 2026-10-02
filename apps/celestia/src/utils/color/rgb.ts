export interface Rgb {
  red: number;
  green: number;
  blue: number;
}

const HEX_PATTERN = /^#?([\da-f]{3}|[\da-f]{6})$/i;
const RGB_PATTERN = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i;

const isChannel = (n: number) => Number.isInteger(n) && n >= 0 && n <= 255;

/** Reads `#abc`, `abc`, `#aabbcc` or `rgb(1, 2, 3)`; anything else is `null` */
export function parseColor(text: string): Rgb | null {
  const value = text.trim();

  const hex = HEX_PATTERN.exec(value);
  if (hex) {
    const digits = hex[1].length === 3 ? [...hex[1]].map((d) => d + d).join('') : hex[1];
    return {
      red: parseInt(digits.slice(0, 2), 16),
      green: parseInt(digits.slice(2, 4), 16),
      blue: parseInt(digits.slice(4, 6), 16),
    };
  }

  const rgb = RGB_PATTERN.exec(value);
  if (rgb) {
    const [red, green, blue] = rgb.slice(1, 4).map(Number);
    if (isChannel(red) && isChannel(green) && isChannel(blue)) return { red, green, blue };
  }

  return null;
}

const channelToHex = (n: number) =>
  Math.min(255, Math.max(0, Math.round(n)))
    .toString(16)
    .padStart(2, '0');

/** Lowercase `#rrggbb`, channels are rounded and clamped to 0–255 */
export const rgbToHex = ({ red, green, blue }: Rgb): string => `#${channelToHex(red)}${channelToHex(green)}${channelToHex(blue)}`;

/** Perceived brightness (YIQ) from 0 to 255 */
export const brightness = ({ red, green, blue }: Rgb): number => (red * 299 + green * 587 + blue * 114) / 1000;

/** Whether black text is more readable than white on this color */
export const isLight = (color: Rgb): boolean => brightness(color) > 127;
