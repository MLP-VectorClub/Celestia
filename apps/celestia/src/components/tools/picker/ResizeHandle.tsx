import { useTranslations } from 'next-intl';
import { FC, PointerEvent } from 'react';

import styles from 'modules/PickerAreaList.module.scss';

interface PropTypes {
  /** Called while dragging with the share (50–85) of the width the picking surface should take */
  onResize: (percent: number) => void;
  /** Called once when the drag ends */
  onCommit: (percent: number) => void;
}

const share = (e: PointerEvent<HTMLElement>) => {
  const rect = e.currentTarget.parentElement?.getBoundingClientRect();
  if (!rect || rect.width === 0) return null;
  return Math.min(85, Math.max(50, Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10));
};

/** Drag to change how wide the area list is */
export const ResizeHandle: FC<PropTypes> = ({ onResize, onCommit }) => {
  const t = useTranslations();
  return (
    <div
      className={styles.resizeHandle}
      role="separator"
      aria-orientation="vertical"
      aria-label={t('picker.list.resize')}
      onPointerDown={(e) => e.currentTarget.setPointerCapture(e.pointerId)}
      onPointerMove={(e) => {
        if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
        const percent = share(e);
        if (percent !== null) onResize(percent);
      }}
      onPointerUp={(e) => {
        if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
        e.currentTarget.releasePointerCapture(e.pointerId);
        const percent = share(e);
        if (percent !== null) onCommit(percent);
      }}
    />
  );
};
