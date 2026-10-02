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
      style={{ objectFit: 'contain' }}
      unoptimized
      alt={t('colorGuide.appearance.spriteAlt')}
    />
  );
};

export default SpriteImage;
