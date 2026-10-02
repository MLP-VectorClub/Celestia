import { ImagePixels } from 'src/utils/picker/areas';
import { Levels, applyLevels } from 'src/utils/picker/levels';

/**
 * The decoded images of the open tabs by file hash, with their pixel data read lazily (once) when readings first need it. Kept outside
 * the reducer because the data is large and not serializable
 */
export class ImageStore {
  private images = new Map<string, HTMLImageElement>();

  private pixels = new Map<string, ImagePixels>();

  /** The most recent levels-adjusted rendering of each image */
  private levelled = new Map<string, { key: string; canvas: HTMLCanvasElement }>();

  has = (hash: string) => this.images.has(hash);

  get = (hash: string) => this.images.get(hash);

  set = (hash: string, image: HTMLImageElement) => {
    this.images.set(hash, image);
    this.pixels.delete(hash);
    this.levelled.delete(hash);
  };

  delete = (hash: string) => {
    this.images.delete(hash);
    this.pixels.delete(hash);
    this.levelled.delete(hash);
  };

  /** RGBA bytes of the image at its natural size, `undefined` for an unknown hash or when the browser has no 2D canvas */
  getPixels = (hash: string): ImagePixels | undefined => {
    const cached = this.pixels.get(hash);
    if (cached) return cached;
    const image = this.images.get(hash);
    if (!image) return undefined;
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    // The pixel data is read once and never written, so let the browser keep the canvas on the CPU
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return undefined;
    ctx.drawImage(image, 0, 0);
    const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = { data, width, height };
    this.pixels.set(hash, pixels);
    return pixels;
  };

  /**
   * The image with the levels applied, for display only: readings always use `getPixels`. The last rendering per image is remembered,
   * `undefined` for an unknown hash or when the browser has no 2D canvas
   */
  getLevelled = (hash: string, levels: Levels): HTMLCanvasElement | undefined => {
    const key = `${levels.low}-${levels.high}`;
    const cached = this.levelled.get(hash);
    if (cached?.key === key) return cached.canvas;
    const pixels = this.getPixels(hash);
    if (!pixels) return undefined;
    const canvas = document.createElement('canvas');
    canvas.width = pixels.width;
    canvas.height = pixels.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    ctx.putImageData(new ImageData(applyLevels(pixels.data, levels), pixels.width, pixels.height), 0, 0);
    this.levelled.set(hash, { key, canvas });
    return canvas;
  };
}
