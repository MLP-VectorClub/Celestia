import { RefObject, useEffect, useRef } from 'react';

import { ReverseImageOptions, Rgb, reverseImageData } from 'src/utils/color';

/** What the preview starts from: an uploaded image, or a flat color shown at 192×108 */
export type PreviewSource = { kind: 'image'; image: HTMLImageElement } | { kind: 'color'; color: Rgb };

interface Result {
  imageRef: RefObject<HTMLCanvasElement | null>;
  overlayRef: RefObject<HTMLCanvasElement | null>;
}

/** Paints the source on the image canvas, then (when there is a filter) the filter-free pixels and the flagged-pixel overlay */
export function usePreviewCanvases(source: PreviewSource | null, options: ReverseImageOptions | null): Result {
  const imageRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const imageCanvas = imageRef.current;
    const overlayCanvas = overlayRef.current;
    const imageCtx = imageCanvas?.getContext('2d');
    const overlayCtx = overlayCanvas?.getContext('2d');
    if (!imageCanvas || !overlayCanvas || !imageCtx || !overlayCtx || !source) return;

    const width = source.kind === 'image' ? source.image.naturalWidth : 192;
    const height = source.kind === 'image' ? source.image.naturalHeight : 108;
    imageCanvas.width = overlayCanvas.width = width;
    imageCanvas.height = overlayCanvas.height = height;

    if (source.kind === 'image') imageCtx.drawImage(source.image, 0, 0);
    else {
      imageCtx.fillStyle = `rgb(${source.color.red}, ${source.color.green}, ${source.color.blue})`;
      imageCtx.fillRect(0, 0, width, height);
    }
    overlayCtx.clearRect(0, 0, width, height);
    if (!options) return;

    const pixels = imageCtx.getImageData(0, 0, width, height);
    const { image, overlay } = reverseImageData(pixels.data, options);
    imageCtx.putImageData(new ImageData(image, width, height), 0, 0);
    overlayCtx.putImageData(new ImageData(overlay, width, height), 0, 0);
  }, [source, options]);

  return { imageRef, overlayRef };
}
