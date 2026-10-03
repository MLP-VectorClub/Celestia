import classNames from 'classnames';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { FC, JSX } from 'react';
import { Card, CardBody } from 'reactstrap';

import { SlimAppearance } from '@mlp-vectorclub/api-types';
import styles from 'modules/FullGuideAppearanceList.module.scss';
import { AppearancePreview } from 'src/components/colorguide/AppearancePreview';
import { NutshellLabel } from 'src/components/colorguide/NutshellLabel';
import Abbr from 'src/components/shared/Abbr';
import { useNutshellMode } from 'src/hooks/nutshell';
import { PATHS } from 'src/paths';
import { getNonObviousCharacterTags, getSpriteUrl } from 'src/utils/color-guide';
import { nutshellAka } from 'src/utils/nutshell';

const FullGuideAppearanceList: FC<{ appearances: SlimAppearance[] }> = ({ appearances }) => {
  const t = useTranslations();
  const { enabled: nutshellNames } = useNutshellMode();
  return (
    <div className={styles.list}>
      {appearances.map((a) => {
        let sprite: JSX.Element;

        if (a.sprite) {
          sprite = (
            <div className={classNames('mb-2', styles.spriteWrap)}>
              <Image
                src={getSpriteUrl(a.id, a.sprite)}
                width={100}
                height={100}
                style={{ objectFit: 'contain' }}
                unoptimized
                alt={t('colorGuide.list.spriteAlt', { label: a.label })}
              />
            </div>
          );
        } else {
          sprite = <AppearancePreview data={a.previewData} className={classNames('mb-2', styles.appearancePreview)} />;
        }

        // With nutshell names on the real label is listed as one of the other names, for the appearances that were renamed
        const realLabel = nutshellNames ? nutshellAka(a) : null;
        const aka = [...(realLabel ? [realLabel] : []), ...getNonObviousCharacterTags(a)];

        return (
          <Link key={a.id} href={PATHS.APPEARANCE(a)} passHref legacyBehavior>
            <Card color="link" tag="a" className="me-2 mb-2">
              <CardBody className={classNames('p-2', styles.cardBody)}>
                {sprite}
                <h3 className={classNames('h5 mb-0', styles.label)}>
                  <NutshellLabel appearance={a} />
                </h3>
                {aka.length > 0 && (
                  <small className={classNames('mt-1', styles.aka)}>
                    <Abbr title={t('colorGuide.list.akaTitle')}>{t('colorGuide.list.aka')}</Abbr>
                    {` ${aka.join(', ')}`}
                  </small>
                )}
              </CardBody>
            </Card>
          </Link>
        );
      })}
    </div>
  );
};

export default FullGuideAppearanceList;
