import Link from 'next/link';
import { FC } from 'react';

import { PreviewAppearance } from '@mlp-vectorclub/api-types';
import styles from 'modules/AppearanceLink.module.scss';
import { AppearancePreview } from 'src/components/colorguide/AppearancePreview';
import { PATHS } from 'src/paths';

export const AppearanceLink: FC<PreviewAppearance> = ({ id, label, guide, previewData }) => (
  <Link href={PATHS.APPEARANCE({ id, label, guide })} className={styles.appearanceLink}>
    <AppearancePreview data={previewData} className={styles.appearancePreview} />
    <span className="appearance-name">{label}</span>
  </Link>
);
