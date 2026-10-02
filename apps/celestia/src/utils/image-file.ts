/** Reads an image file the browser can decode; rejects when the file is not an image */
export function loadImageFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('The file could not be read as an image.'));
    };
    image.src = url;
  });
}

/** `photo.jpg` becomes `photo (no multiply filter).png`: the saved file is always a PNG, whatever the source was */
export const filterFreeFileName = (original: string | null, filterType: string): string => {
  const suffix = ` (no ${filterType} filter).png`;
  const name = (original ?? '').split(/[\\/]/).pop() ?? '';
  const base = name.replace(/\.[^.]+$/, '');
  return `${base || 'image'}${suffix}`;
};

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
