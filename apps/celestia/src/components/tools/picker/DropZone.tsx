import classNames from 'classnames';
import { DragEvent, FC, HTMLAttributes, useState } from 'react';

import styles from 'modules/Picker.module.scss';

/** Wraps the picker and accepts image files dropped anywhere on it */
export const DropZone: FC<HTMLAttributes<HTMLDivElement> & { onFiles: (files: File[]) => void }> = ({ onFiles, children, ...rest }) => {
  const [over, setOver] = useState(false);
  const hasFiles = (e: DragEvent) => e.dataTransfer.types.includes('Files');

  return (
    <div
      {...rest}
      className={classNames(styles.dropZone, { [styles.dropOver]: over })}
      onDragOver={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        setOver(false);
        onFiles(Array.from(e.dataTransfer.files));
      }}
    >
      {children}
    </div>
  );
};
