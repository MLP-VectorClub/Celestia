import { useTranslations } from 'next-intl';
import { FC } from 'react';

import { ColorGroup } from '@mlp-vectorclub/api-types';
import styles from 'modules/CompactColorGroups.module.scss';
import ColorSquare from 'src/components/colorguide/ColorSquare';

interface PropTypes {
  colorGroups?: ColorGroup[];
}

const AppearanceItemColorGroups: FC<PropTypes> = ({ colorGroups }) => {
  const t = useTranslations();
  return colorGroups && colorGroups.length > 0 ? (
    <div className={styles.compactColorGroups} aria-label={t('colorGuide.appearance.colorGroups')}>
      {colorGroups.map((cg) => (
        <div key={cg.id} className={styles.compactColorGroup}>
          <span className={styles.compactColorGroupLabel}>{cg.label}</span>
          <div className={styles.compactColorList}>
            {cg.colors.map((c) => (
              <ColorSquare key={c.id} color={c} compact />
            ))}
          </div>
        </div>
      ))}
    </div>
  ) : null;
};

export default AppearanceItemColorGroups;
