import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { FC } from 'react';

import { Sprite } from '@mlp-vectorclub/api-types';
import styles from 'modules/SpriteColumn.module.scss';
import { getSpriteUrl } from 'src/utils/color-guide';

interface PropTypes {
  appearanceId: number;
  sprite: Sprite | null;
  height?: number;
}

/**
 * The contract does not send an aspect ratio, so the sprite is fitted into a square of the requested size
 */
const SpriteImage: FC<PropTypes> = ({ appearanceId, sprite, height = 150 }) => {
  const t = useTranslations();
  if (!sprite) {
    return null;
  }

  return (
    <Image
      className={styles.spriteImage}
      src={getSpriteUrl(appearanceId, sprite, height > 300 ? 600 : 300)}
      width={height}
      height={height}
      // The list's box is a square the sprite is fitted into (the class sets its 150px). The big version on the page is shown at the size of
      // the file, like the old site did, and only shrinks (keeping its proportions) when its column is narrower
      style={height > 300 ? { height: 'auto', width: 'auto', maxWidth: '100%' } : { objectFit: 'contain', height, maxWidth: '100%' }}
      unoptimized
      alt={t('colorGuide.appearance.spriteAlt')}
    />
  );
};

export default SpriteImage;
