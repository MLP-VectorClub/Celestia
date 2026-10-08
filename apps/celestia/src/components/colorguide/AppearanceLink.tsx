import Link from 'next/link';
import { FC } from 'react';

import { PreviewAppearance } from '@mlp-vectorclub/api-types';
import styles from 'modules/AppearanceLink.module.scss';
import { AppearancePreview } from 'src/components/colorguide/AppearancePreview';
import { NutshellLabel } from 'src/components/colorguide/NutshellLabel';
import InlineIcon from 'src/components/shared/InlineIcon';
import { PATHS } from 'src/paths';

export const AppearanceLink: FC<
  Pick<PreviewAppearance, 'id' | 'label'> &
    Partial<Pick<PreviewAppearance, 'guide' | 'previewData' | 'ownerId' | 'nutshellNames'>> & {
      /** Where the link goes when it is not the appearance's page in a guide (personal guide appearances) */
      href?: string;
      /** A private personal guide appearance, which its owner and staff see: an orange lock stands where the color preview would be, the name stays */
      isPrivate?: boolean;
      /** The lock's tooltip, in the caller's language namespace */
      privateTitle?: string;
    }
> = ({ id, label, guide, previewData, ownerId, nutshellNames, href, isPrivate, privateTitle }) => {
  return (
    <Link href={href ?? PATHS.APPEARANCE({ id, label, guide: guide! })} className={styles.appearanceLink}>
      {isPrivate ? (
        <InlineIcon icon="lock" first className="text-orange" title={privateTitle} />
      ) : (
        <AppearancePreview data={previewData} className={styles.appearancePreview} />
      )}
      <span className="appearance-name">
        <NutshellLabel appearance={{ label, ownerId, nutshellNames }} />
      </span>
    </Link>
  );
};
