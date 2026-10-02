import { FC, RefObject } from 'react';
import { Button } from 'reactstrap';

import { downloadBlob, filterFreeFileName } from 'src/utils/image-file';

interface PropTypes {
  imageRef: RefObject<HTMLCanvasElement | null>;
  overlayRef: RefObject<HTMLCanvasElement | null>;
  includeOverlay: boolean;
  fileName: string | null;
  filterType: string;
  disabled: boolean;
}

/** Downloads the filter-free image as a PNG, with the overlay baked in when it is shown */
export const SaveFilterFreeButton: FC<PropTypes> = ({ imageRef, overlayRef, includeOverlay, fileName, filterType, disabled }) => (
  <Button
    color="success"
    disabled={disabled}
    onClick={() => {
      const source = imageRef.current;
      if (!source) return;
      const target = document.createElement('canvas');
      target.width = source.width;
      target.height = source.height;
      const ctx = target.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(source, 0, 0);
      if (includeOverlay && overlayRef.current) ctx.drawImage(overlayRef.current, 0, 0);
      target.toBlob((blob) => blob && downloadBlob(blob, filterFreeFileName(fileName, filterType)), 'image/png');
    }}
  >
    Save filter-free image
  </Button>
);
