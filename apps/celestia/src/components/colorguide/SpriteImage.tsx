import { Sprite } from '@went.tf/mlp-vectorclub-api-types';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { FC } from 'react';

import styles from 'modules/SpriteColumn.module.scss';
import { getSpriteUrl } from 'src/utils/color-guide';

interface PropTypes {
  appearanceId: number;
  sprite: Sprite | null;
  /** The size it is shown at, in CSS pixels */
  height?: number;
  /** Loads the 600px file (sharp on high density screens) instead of the 300px one, still shown at `height` at most */
  highRes?: boolean;
  /** The share token of a private appearance */
  token?: string;
}

/**
 * The contract does not send an aspect ratio. The list's small box fits the sprite into a square of `height`; the big version keeps the
 * file's proportions and is only clamped to `height` (and to its column, when that is narrower)
 */
const SpriteImage: FC<PropTypes> = ({ appearanceId, sprite, height = 150, highRes = false, token }) => {
  const t = useTranslations();
  if (!sprite) {
    return null;
  }

  // As on the old site, the sprite is a link to the image itself for everybody, not only for those who can change it
  return (
    <a
      href={getSpriteUrl(appearanceId, sprite, 600, token)}
      target="_blank"
      rel="noopener noreferrer"
      title={t('colorGuide.edit.sprite.openInNewTab')}
    >
      <Image
        className={styles.spriteImage}
        src={getSpriteUrl(appearanceId, sprite, highRes ? 600 : 300, token)}
        width={height}
        height={height}
        // The class sets the list's 150px height, which the big version has to override
        style={
          highRes
            ? { height: 'auto', width: 'auto', maxWidth: `min(100%, ${height}px)`, maxHeight: height }
            : { objectFit: 'contain', height, maxWidth: '100%' }
        }
        unoptimized
        alt={t('colorGuide.appearance.spriteAlt')}
      />
    </a>
  );
};

export default SpriteImage;
