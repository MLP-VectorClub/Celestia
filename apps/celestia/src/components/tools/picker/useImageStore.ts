import { useState } from 'react';

import { ImageStore } from 'src/utils/picker/image-store';

/** One store of decoded images for the lifetime of the picker */
export const useImageStore = (): ImageStore => useState(() => new ImageStore())[0];

export type { ImageStore };
