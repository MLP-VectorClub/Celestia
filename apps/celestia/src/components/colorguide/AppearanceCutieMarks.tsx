import { Appearance, CutieMark } from '@went.tf/mlp-vectorclub-api-types';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { FC, ReactNode } from 'react';
import { Button, Card, CardBody } from 'reactstrap';

import styles from 'modules/AppearanceCutieMarks.module.scss';
import { CutieMarkPreview } from 'src/components/colorguide/CutieMarkPreview';
import ButtonCollection from 'src/components/shared/ButtonCollection';
import InlineIcon from 'src/components/shared/InlineIcon';
import { ResponsiveContainer } from 'src/components/shared/ResponsiveContainer';
import UserLinkWithAvatar from 'src/components/shared/UserLinkWithAvatar';
import { API_PREFIX } from 'src/config';
import { useAuth } from 'src/hooks';
import { createFavMeUrl, permission } from 'src/utils';

interface PropTypes {
  appearanceId: number;
  label: string;
  cutieMarks?: CutieMark[];
  colorGroups: Appearance['colorGroups'];
  /** Whoever can change the cutie marks gets the section even while there are none, with these buttons at its end */
  actions?: ReactNode;
}

export const AppearanceCutieMarks: FC<PropTypes> = ({ appearanceId, label, cutieMarks, colorGroups, actions }) => {
  const t = useTranslations();
  const { user } = useAuth();
  const isDeveloper = user.role && permission(user.role, 'developer');
  const isStaff = user.role && permission(user.role, 'staff');

  const count = cutieMarks?.length ?? 0;
  if (count === 0 && !actions) return null;

  return (
    <section className="approved-cutie-mark">
      <h2>
        <InlineIcon icon="image" first size="xs" />
        {t('colorGuide.cutieMarkDisplay.heading', { count: Math.max(count, 1) })}
      </h2>
      {count === 0 && <p className="fst-italic text-muted">{t('colorGuide.cutieMarkDisplay.none')}</p>}
      {count > 0 && (
        <p className={styles.aside}>
          {t.rich('colorGuide.cutieMarkDisplay.disclaimer', { strong: (chunks) => <strong>{chunks}</strong> })}
        </p>
      )}
      <div className={styles.cutieMarks}>
        {(cutieMarks ?? []).map((cm) => {
          const facingText = t('colorGuide.cutieMarkDisplay.facing', { facing: cm.facing ?? 'none' });
          const cmTitleId = `cutie-mark-${cm.id}-title`;
          return (
            <Card key={cm.id} id={`cm${cm.id}`} className={styles.cutieMarkCard} aria-describedby={cmTitleId}>
              <CardBody className="p-2">
                <span className={styles.title} id={cmTitleId}>
                  {isDeveloper && (
                    <span className="text-muted me-2" aria-hidden="true">
                      #{cm.id}
                    </span>
                  )}
                  {cm.label || facingText}
                </span>
                {cm.label && <span className={styles.subtitle}>{facingText}</span>}
                <div className={styles.preview}>
                  <CutieMarkPreview {...cm} colorGroups={colorGroups} />
                  <div className={styles.previewImageContainer}>
                    <div className={styles.previewImageWrap} style={{ transform: `rotate(${cm.rotation}deg)` }}>
                      <ResponsiveContainer size={1}>
                        <Image src={cm.viewUrl} unoptimized fill alt={t('colorGuide.cutieMarkDisplay.vectorAlt')} />
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
                <ButtonCollection compact className="mt-3">
                  <Button
                    tag="a"
                    size="sm"
                    color="ui"
                    href={cm.viewUrl}
                    download={t('colorGuide.cutieMarkDisplay.downloadName', { label })}
                    aria-label={t('colorGuide.cutieMarkDisplay.downloadSvg')}
                  >
                    <InlineIcon icon="download" first />
                    {t('colorGuide.cutieMarkDisplay.svg')}
                  </Button>
                  {isStaff && (
                    // The file as it was uploaded, before it was cleaned up and recolored with the guide's colors
                    <Button
                      tag="a"
                      size="sm"
                      color="orange"
                      href={`${API_PREFIX}/appearances/${appearanceId}/cutie-marks/${cm.id}/download?source=1`}
                      title={t('colorGuide.cutieMarkDisplay.downloadSource')}
                      aria-label={t('colorGuide.cutieMarkDisplay.downloadSource')}
                      data-testid={`cm-source-${cm.id}`}
                    >
                      <InlineIcon icon="download" />
                    </Button>
                  )}
                  {cm.favMe && (
                    <Button
                      tag="a"
                      size="sm"
                      color="deviantart"
                      href={createFavMeUrl(cm.favMe)}
                      aria-label={t('colorGuide.cutieMarkDisplay.viewSource')}
                    >
                      <InlineIcon icon={['fab', 'deviantart']} first />
                      {t('colorGuide.cutieMarkDisplay.source')}
                    </Button>
                  )}
                </ButtonCollection>
                {cm.contributor && (
                  <div className={styles.byLine}>
                    <span className="me-2">{t('colorGuide.cutieMarkDisplay.by')}</span>
                    <UserLinkWithAvatar {...cm.contributor} />
                  </div>
                )}
              </CardBody>
            </Card>
          );
        })}
      </div>
      {actions}
    </section>
  );
};
