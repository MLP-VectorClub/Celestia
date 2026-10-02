import { FC } from 'react';
import { Button } from 'reactstrap';

import styles from 'modules/Picker.module.scss';

export const EmptyState: FC<{ onOpen: () => void; busy: boolean }> = ({ onOpen, busy }) => (
  <div className={styles.empty}>
    <p>Use the File menu, paste an image or drop image files here to start picking colors.</p>
    <Button color="primary" onClick={onOpen} disabled={busy}>
      Open an image…
    </Button>
  </div>
);
