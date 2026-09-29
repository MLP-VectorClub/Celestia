import classNames from 'classnames';
import Image from 'next/image';
import Link from 'next/link';
import { FC, JSX } from 'react';
import { Card, CardBody } from 'reactstrap';

import { SlimAppearance } from '@mlp-vectorclub/api-types';
import styles from 'modules/FullGuideAppearanceList.module.scss';
import { AppearancePreview } from 'src/components/colorguide/AppearancePreview';
import Abbr from 'src/components/shared/Abbr';
import { PATHS } from 'src/paths';
import { scaleResize } from 'src/utils';

const FullGuideAppearanceList: FC<{ appearances: SlimAppearance[] }> = ({ appearances }) => (
  <div className={styles.list}>
    {appearances.map((a) => {
      let sprite: JSX.Element;

      if (a.sprite) {
        const [aspectWidth, aspectHeight] = a.sprite.aspectRatio;
        const spriteStyle = scaleResize(aspectWidth, aspectHeight, 'height', 100);
        sprite = (
          <div className={classNames('mb-2', styles.spriteWrap)}>
            <Image src={a.sprite.path} width={spriteStyle.width} height={spriteStyle.height} unoptimized alt="Appearance preview image" />
          </div>
        );
      } else {
        sprite = <AppearancePreview data={a.previewData} className={classNames('mb-2', styles.appearancePreview)} />;
      }

      const lowerCaseLabel = a.label.toLowerCase();
      const nonObviousCharacterTags = (a.characterTagNames as string[]).filter((tag) => !lowerCaseLabel.includes(tag));

      return (
        <Link key={a.id} href={PATHS.APPEARANCE(a)} passHref legacyBehavior>
          <Card color="link" tag="a" className="me-2 mb-2">
            <CardBody className={classNames('p-2', styles.cardBody)}>
              {sprite}
              <h3 className={classNames('h5 mb-0', styles.label)}>{a.label}</h3>
              {nonObviousCharacterTags.length > 0 && (
                <small className={classNames('mt-1', styles.aka)}>
                  <Abbr title="Also known as">AKA</Abbr>
                  {` ${nonObviousCharacterTags.join(', ')}`}
                </small>
              )}
            </CardBody>
          </Card>
        </Link>
      );
    })}
  </div>
);

export default FullGuideAppearanceList;
