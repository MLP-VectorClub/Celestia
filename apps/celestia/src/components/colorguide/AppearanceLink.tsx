import Link from 'next/link';
import { FC } from 'react';

import { PreviewAppearance } from '@mlp-vectorclub/api-types';
import styles from 'modules/AppearanceLink.module.scss';
import { AppearancePreview } from 'src/components/colorguide/AppearancePreview';
import { NutshellLabel } from 'src/components/colorguide/NutshellLabel';
import { PATHS } from 'src/paths';

export const AppearanceLink: FC<
  Pick<PreviewAppearance, 'id' | 'label'> &
    Partial<Pick<PreviewAppearance, 'guide' | 'previewData' | 'ownerId' | 'nutshellNames'>> & {
      /** Where the link goes when it is not the appearance's page in a guide (personal guide appearances) */
      href?: string;
    }
> = ({ id, label, guide, previewData, ownerId, nutshellNames, href }) => (
  <Link href={href ?? PATHS.APPEARANCE({ id, label, guide: guide! })} className={styles.appearanceLink}>
    <AppearancePreview data={previewData} className={styles.appearancePreview} />
    <span className="appearance-name">
      <NutshellLabel appearance={{ label, ownerId, nutshellNames }} />
    </span>
  </Link>
);
