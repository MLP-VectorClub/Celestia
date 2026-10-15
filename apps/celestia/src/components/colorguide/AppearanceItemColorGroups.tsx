import { ColorGroup } from '@went.tf/mlp-vectorclub-api-types';
import { useTranslations } from 'next-intl';
import { FC } from 'react';

import styles from 'modules/CompactColorGroups.module.scss';
import ColorSquare from 'src/components/colorguide/ColorSquare';

interface PropTypes {
  colorGroups?: ColorGroup[];
  /** Name of the appearance, for the RGB values dialog */
  appearanceLabel?: string;
}

const AppearanceItemColorGroups: FC<PropTypes> = ({ colorGroups, appearanceLabel }) => {
  const t = useTranslations();
  return colorGroups && colorGroups.length > 0 ? (
    <div className={styles.compactColorGroups} aria-label={t('colorGuide.appearance.colorGroups')}>
      {colorGroups.map((cg) => (
        <div key={cg.id} className={styles.compactColorGroup}>
          <span className={styles.compactColorGroupLabel}>{cg.label}</span>
          <div className={styles.compactColorList}>
            {cg.colors.map((c) => (
              <ColorSquare key={c.id} color={c} compact path={appearanceLabel ? [appearanceLabel, cg.label] : [cg.label]} />
            ))}
          </div>
        </div>
      ))}
    </div>
  ) : (
    <div className={styles.noColorGroups}>{t('colorGuide.appearance.noColorGroups')}</div>
  );
};

export default AppearanceItemColorGroups;
