import Link from 'next/link';
import { FC } from 'react';

import { PreviewAppearance } from '@mlp-vectorclub/api-types';
import styles from 'modules/AppearanceLink.module.scss';
import { AppearancePreview } from 'src/components/colorguide/AppearancePreview';
import { NutshellLabel } from 'src/components/colorguide/NutshellLabel';
import { PATHS } from 'src/paths';

export const AppearanceLink: FC<
  Pick<PreviewAppearance, 'id' | 'label' | 'guide'> & Partial<Pick<PreviewAppearance, 'previewData' | 'ownerId' | 'nutshellNames'>>
> = ({ id, label, guide, previewData, ownerId, nutshellNames }) => (
  <Link href={PATHS.APPEARANCE({ id, label, guide })} className={styles.appearanceLink}>
    <AppearancePreview data={previewData} className={styles.appearancePreview} />
    <span className="appearance-name">
      <NutshellLabel appearance={{ label, ownerId, nutshellNames }} />
    </span>
  </Link>
);
