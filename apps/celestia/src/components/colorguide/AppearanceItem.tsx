import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { FC, useMemo, useState } from 'react';
import { Card, CardBody, Col, Row } from 'reactstrap';

import { Appearance, GuideName } from '@mlp-vectorclub/api-types';
import styles from 'modules/AppearanceItem.module.scss';
import { AppearanceMetaDialog } from 'src/components/colorguide/AppearanceMetaDialog';
import AppearanceItemColorGroups from 'src/components/colorguide/AppearanceItemColorGroups';
import AppearanceItemNotes from 'src/components/colorguide/AppearanceItemNotes';
import AppearanceItemTags from 'src/components/colorguide/AppearanceItemTags';
import { NutshellLabel } from 'src/components/colorguide/NutshellLabel';
import SpriteImage from 'src/components/colorguide/SpriteImage';
import { SwatchDialog } from 'src/components/colorguide/SwatchDialog';
import InlineIcon from 'src/components/shared/InlineIcon';
import { IconButton, IconLink } from 'src/components/shared/IconButton';
import TimeAgo from 'src/components/shared/TimeAgo';
import { useDialog } from 'src/components/shared/dialogs/DialogProvider';
import { API_PREFIX } from 'src/config';
import { describeApiError, useApiMutation, useAuth } from 'src/hooks';
import { PATHS } from 'src/paths';
import { AppearanceEditService } from 'src/services/appearance-edit';
import { Nullable } from 'src/types';

export interface AppearanceItemProps {
  appearance: Appearance & { lastMajorChange?: Nullable<string>; private?: boolean };
  pinned?: boolean;
  guide?: Nullable<GuideName>;
}

/** An entry of a guide's list: sprite, name with its buttons, notes, tags and the color groups */
const AppearanceItem: FC<AppearanceItemProps> = ({ appearance, pinned = false, guide }) => {
  const t = useTranslations();
  const { isStaff } = useAuth();
  const { confirm } = useDialog();
  const queryClient = useQueryClient();
  const [swatchOpen, setSwatchOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const appearanceLink = useMemo(() => PATHS.APPEARANCE({ ...appearance, guide: appearance.guide ?? guide ?? null }), [appearance, guide]);
  const isOfficial = appearance.ownerId === null || appearance.ownerId === undefined;

  // Lists (guide pages, pinned appearances, searches) show the changed entry again
  const refresh = () =>
    queryClient.invalidateQueries({ predicate: (query) => typeof query.queryKey[0] === 'string' && query.queryKey[0].startsWith('/appearances') });
  const pin = useApiMutation(() => AppearanceEditService.pin(appearance.id), { onSuccess: () => void refresh() });
  const unpin = useApiMutation(() => AppearanceEditService.unpin(appearance.id), { onSuccess: () => void refresh() });
  const remove = useApiMutation(() => AppearanceEditService.remove(appearance.id), { onSuccess: () => void refresh() });
  const error = pin.error ?? unpin.error ?? remove.error;

  return (
    <Card id={`p${appearance.id}`} className={`${styles.appearanceItem} mb-3`} role="region" aria-label={pinned ? 'Pinned Appearance' : 'Appearance'}>
      <CardBody className="p-2">
        <Row noGutters>
          <Col xs="auto">
            <div className="pe-3" role="presentation">
              <div className={styles.spriteBox}>
                <SpriteImage appearanceId={appearance.id} sprite={appearance.sprite} />
              </div>
            </div>
          </Col>
          <Col>
            <div className={styles.header}>
              {appearance.private && <InlineIcon icon="lock" first className="text-warning" title={t('colorGuide.item.private')} />}
              {pinned && <InlineIcon icon="thumbtack" first className={styles.pinIcon} title={t('colorGuide.item.pinned')} />}
              <Link href={appearanceLink} className={styles.appearanceName}>
                <NutshellLabel appearance={appearance} />
              </Link>
              <div className={styles.buttons}>
                <IconLink
                  icon="image"
                  color="link"
                  title={t('colorGuide.item.viewPng')}
                  href={`${API_PREFIX}/appearances/${appearance.id}/image?type=palette&format=png`}
                  target="_blank"
                  rel="noopener noreferrer"
                />
                <IconButton icon="paint-brush" color="teal" title={t('colorGuide.item.swatch')} onClick={() => setSwatchOpen(true)} />
                {isStaff && (
                  <>
                    <IconButton icon="pencil-alt" color="darkblue" title={t('colorGuide.item.edit')} onClick={() => setEditOpen(true)} />
                    {!pinned && isOfficial && (
                      <IconButton icon="thumbtack" color="darkblue" title={t('colorGuide.item.pin')} disabled={pin.isPending} onClick={() => pin.mutate()} />
                    )}
                    {!pinned && (
                      <IconButton
                        icon="trash"
                        color="red"
                        title={t('colorGuide.item.delete')}
                        disabled={remove.isPending}
                        onClick={async () => {
                          if (
                            await confirm({
                              title: t('colorGuide.edit.actions.delete'),
                              body: t('colorGuide.edit.actions.deleteBody', { label: appearance.label }),
                              color: 'danger',
                              confirmLabel: t('colorGuide.edit.common.delete'),
                            })
                          ) {
                            remove.mutate();
                          }
                        }}
                      />
                    )}
                    {pinned && isOfficial && (
                      <IconButton icon="thumbtack" color="orange" title={t('colorGuide.item.unpin')} disabled={unpin.isPending} onClick={() => unpin.mutate()} />
                    )}
                  </>
                )}
              </div>
            </div>
            {error && <div className="text-danger small">{describeApiError(error)}</div>}
            {appearance.lastMajorChange && (
              <div className={styles.update}>
                {t('colorGuide.item.lastMajorChange')} <TimeAgo date={appearance.lastMajorChange} />
              </div>
            )}
            <AppearanceItemNotes notes={appearance.notes} hasCutieMarks={appearance.hasCutieMarks} />
            {isOfficial && !pinned && <AppearanceItemTags tags={appearance.tags} guide={guide} />}
            <AppearanceItemColorGroups colorGroups={appearance.colorGroups} appearanceLabel={appearance.label} />
          </Col>
        </Row>
      </CardBody>
      <SwatchDialog appearanceId={appearance.id} name={appearance.label} isOpen={swatchOpen} onClose={() => setSwatchOpen(false)} />
      {isStaff && <AppearanceMetaDialog appearance={appearance} isOpen={editOpen} onClose={() => setEditOpen(false)} />}
    </Card>
  );
};

export default AppearanceItem;
