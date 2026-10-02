import { FilterType, Rgba, clamp, reverseChannel } from 'src/utils/color/filters';

export interface ReverseImageOptions {
  type: FilterType;
  filter: Rgba;
  /** How far past 0 or 255 a restored channel may land before the pixel is flagged, 0–255 */
  sensitivity: number;
  /** Paint color for flagged pixels, `alpha` is 0–1 */
  overlay: Rgba;
}

export interface ReverseImageResult {
  /** RGBA bytes of the image with the filter removed (alpha is left untouched) */
  image: Uint8ClampedArray<ArrayBuffer>;
  /** RGBA bytes that are transparent except for the flagged pixels, where the filter cannot be undone cleanly */
  overlay: Uint8ClampedArray<ArrayBuffer>;
}

/** Removes a filter from RGBA pixel data and flags pixels whose restored color falls outside the valid range */
export function reverseImageData(
  pixels: ArrayLike<number>,
  { type, filter, sensitivity, overlay }: ReverseImageOptions
): ReverseImageResult {
  const image = new Uint8ClampedArray(pixels.length);
  const flags = new Uint8ClampedArray(pixels.length);
  const filterChannels = [filter.red, filter.green, filter.blue];

  for (let i = 0; i < pixels.length; i += 4) {
    let flagged = false;
    for (let c = 0; c < 3; c++) {
      const restored = reverseChannel(type, filter.alpha, filterChannels[c], pixels[i + c]);
      if (restored - sensitivity > 255 || restored + sensitivity < 0) flagged = true;
      image[i + c] = clamp(restored, 0, 255);
    }
    image[i + 3] = pixels[i + 3];
    if (flagged) {
      flags[i] = overlay.red;
      flags[i + 1] = overlay.green;
      flags[i + 2] = overlay.blue;
      flags[i + 3] = overlay.alpha * 255;
    }
  }

  return { image, overlay: flags };
}
