import { FC } from 'react';

import styles from 'modules/NutshellLabel.module.scss';
import { useNutshellMode } from 'src/hooks/nutshell';
import { NutshellSource, isRenamedInNutshellMode, nutshellLabel } from 'src/utils/nutshell';

/** The name of an appearance: its label, or its nutshell name when the visitor has that mode on */
export const NutshellLabel: FC<{ appearance: NutshellSource }> = ({ appearance }) => {
  const { roll } = useNutshellMode();
  if (roll === null || !isRenamedInNutshellMode(appearance)) return <>{appearance.label}</>;
  return <span className={styles.nutshell}>{nutshellLabel(appearance, roll)}</span>;
};
