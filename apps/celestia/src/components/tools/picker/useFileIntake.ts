import { Dispatch, useCallback, useEffect, useRef, useState } from 'react';

import { ImageStore } from 'src/components/tools/picker/useImageStore';
import { loadImageFile } from 'src/utils/image-file';
import { hashBlob } from 'src/utils/picker/file-hash';
import { PickerAction } from 'src/utils/picker/reducer';

const IMAGE_NAME = /\.(png|jpe?g|bmp|gif|webp)$/i;

interface Options {
  dispatch: Dispatch<PickerAction>;
  store: ImageStore;
  /** Picking area size given to newly opened tabs */
  pickingSize: number;
}

/** Everything that turns files into tabs: the file dialog, drag and drop, pasted images and the clipboard menu entry */
export function useFileIntake({ dispatch, store, pickingSize }: Options) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const openFiles = useCallback(
    async (files: File[]) => {
      setBusy(true);
      const failed: string[] = [];
      // One after the other, so the tabs appear in the order the files were given
      for (const file of files) {
        if (!file.type.startsWith('image/') && !IMAGE_NAME.test(file.name)) {
          failed.push(`“${file.name}” is not an image.`);
          continue;
        }
        try {
          const [hash, image] = await Promise.all([hashBlob(file), loadImageFile(file)]);
          if (!store.has(hash)) store.set(hash, image);
          dispatch({ type: 'openTab', name: file.name, hash, width: image.naturalWidth, height: image.naturalHeight, pickingSize });
        } catch {
          failed.push(`“${file.name}” could not be read as an image.`);
        }
      }
      setErrors(failed);
      setBusy(false);
    },
    [dispatch, store, pickingSize]
  );

  const browse = useCallback(() => inputRef.current?.click(), []);

  /** Reads images from the system clipboard, which needs the visitor's permission */
  const pasteFromClipboard = useCallback(async () => {
    try {
      const items = await navigator.clipboard.read();
      const files: File[] = [];
      for (const item of items) {
        const type = item.types.find((t) => t.startsWith('image/'));
        if (type) files.push(new File([await item.getType(type)], `pasted-image.${type.split('/')[1]}`, { type }));
      }
      if (files.length === 0) setErrors(['There is no image on the clipboard.']);
      else await openFiles(files);
    } catch {
      setErrors(['The clipboard could not be read. Allow clipboard access, or paste with Ctrl+V.']);
    }
  }, [openFiles]);

  // Ctrl+V with an image on the clipboard works without any permission prompt
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files ?? []).filter((f) => f.type.startsWith('image/'));
      if (files.length === 0) return;
      e.preventDefault();
      void openFiles(files);
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [openFiles]);

  return { inputRef, browse, openFiles, pasteFromClipboard, errors, dismissErrors: () => setErrors([]), busy };
}
