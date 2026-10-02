import { useTranslations } from 'next-intl';
import { FC } from 'react';
import { Button } from 'reactstrap';

import styles from 'modules/Picker.module.scss';

export const EmptyState: FC<{ onOpen: () => void; busy: boolean }> = ({ onOpen, busy }) => {
  const t = useTranslations();
  return (
    <div className={styles.empty}>
      <p>{t('picker.empty.text')}</p>
      <Button color="primary" onClick={onOpen} disabled={busy}>
        {t('picker.empty.open')}
      </Button>
    </div>
  );
};
