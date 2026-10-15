import { DetailedAppearance, GuideName } from '@went.tf/mlp-vectorclub-api-types';
import { useTranslations } from 'next-intl';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FC, Fragment, useMemo, useState } from 'react';
import { Alert, Button } from 'reactstrap';

import styles from 'modules/AppearancePage.module.scss';
import { AppearanceColorGroups } from 'src/components/colorguide/AppearanceColorGroups';
import { AppearanceCutieMarks } from 'src/components/colorguide/AppearanceCutieMarks';
import {
  AppearanceHeaderActions,
  EditCutieMarksButton,
  EditRelationsButton,
  EditTagsButton,
} from 'src/components/colorguide/AppearanceEditActions';
import { AppearanceLink } from 'src/components/colorguide/AppearanceLink';
import { AppearanceNotes } from 'src/components/colorguide/AppearanceNotes';
import { AppearanceTagEditor } from 'src/components/colorguide/AppearanceTagEditor';
import AppearanceTags from 'src/components/colorguide/AppearanceTags';
import { useColorCopyWidget } from 'src/components/colorguide/ColorCopyWidget';
import { GuideLink } from 'src/components/colorguide/GuideLink';
import { GuideNotFound } from 'src/components/colorguide/GuideNotFound';
import { NutshellLabel } from 'src/components/colorguide/NutshellLabel';
import { ShareAppearanceButton } from 'src/components/colorguide/ShareAppearanceButton';
import SpriteImage from 'src/components/colorguide/SpriteImage';
import { SpriteWrap } from 'src/components/colorguide/SpriteWrap';
import { SwatchDialog } from 'src/components/colorguide/SwatchDialog';
import { NewTagButton, TagMenu } from 'src/components/colorguide/TagStaffMenus';
import ButtonCollection from 'src/components/shared/ButtonCollection';
import Content from 'src/components/shared/Content';
import InlineIcon from 'src/components/shared/InlineIcon';
import StandardHeading from 'src/components/shared/StandardHeading';
import StatusAlert from 'src/components/shared/StatusAlert';
import TimeAgo from 'src/components/shared/TimeAgo';
import UserLink from 'src/components/shared/UserLink';
import { APP_HOST } from 'src/config';
import { useAuth, useDetailedAppearance } from 'src/hooks';
import { PATHS } from 'src/paths';
import { Nullable } from 'src/types';
import { assembleSeoUrl } from 'src/utils';
import { getAppearanceFileUrl, getSpriteUrl } from 'src/utils/color-guide';
import { appearanceShareUrl } from 'src/utils/share-url';
import { formatShowHeading } from 'src/utils/show';

interface AppearanceViewProps {
  /** The guide from the URL, personal guide appearances have none */
  guide: Nullable<GuideName>;
  id: number | null;
  initialAppearance: Nullable<DetailedAppearance>;
}

interface SeoData {
  description: string;
  canonical: string;
  ogImage?: { url: string; width: number; height: number };
}

export const AppearanceView: FC<AppearanceViewProps> = ({ guide, id, initialAppearance }) => {
  const t = useTranslations();
  const { query } = useRouter();
  const token = typeof query.token === 'string' ? query.token : undefined;
  const params = useMemo(() => ({ id, token }), [id, token]);
  const { appearance, status } = useDetailedAppearance(params, initialAppearance || undefined);
  const [swatchOpen, setSwatchOpen] = useState(false);
  const [editingTags, setEditingTags] = useState(false);
  const { user: visitor } = useAuth();
  // Who the notice of a private appearance says can see its colors
  const privateWho = appearance?.ownerId == null ? 'official' : appearance.ownerId === visitor.id ? 'owner' : 'other';
  useColorCopyWidget();

  const seoData = useMemo<SeoData | null>(
    () =>
      appearance
        ? {
            description: `Show accurate colors for "${appearance.label}" from the MLP-VectorClub's Official Color Guide`,
            canonical: assembleSeoUrl(PATHS.APPEARANCE(appearance)),
            ogImage: appearance.sprite
              ? { width: 600, height: 600, url: `${APP_HOST}${getSpriteUrl(appearance.id, appearance.sprite, 600)}` }
              : undefined,
          }
        : null,
    [appearance]
  );
  const shortUrl = useMemo(
    () => appearance && appearanceShareUrl(assembleSeoUrl(PATHS.SHORT_APPEARANCE(appearance)), appearance.token),
    [appearance]
  );

  if (!appearance) {
    return <GuideNotFound heading={t('colorGuide.notFound.unknownAppearance')} noun={t('colorGuide.notFound.nouns.appearance')} />;
  }

  return (
    <Content>
      {seoData && (
        <Head>
          <meta name="description" content={seoData.description} />
          <meta key="og:description" property="og:description" content={seoData.description} />
          <link key="canonical" rel="canonical" href={seoData.canonical} />
          {seoData.ogImage && (
            <>
              <meta key="og:image" property="og:image" content={seoData.ogImage.url} />
              <meta property="og:image:width" content={String(seoData.ogImage.width)} />
              <meta property="og:image:height" content={String(seoData.ogImage.height)} />
            </>
          )}
        </Head>
      )}
      {appearance.canEdit ? (
        <SpriteWrap appearanceId={appearance.id} sprite={appearance.sprite} token={token} />
      ) : (
        appearance.sprite && (
          <div className={styles.spriteImage}>
            <a
              href={getSpriteUrl(appearance.id, appearance.sprite, 600, token)}
              target="_blank"
              rel="noopener"
              title={t('colorGuide.edit.sprite.openInNewTab')}
            >
              <SpriteImage appearanceId={appearance.id} sprite={appearance.sprite} height={300} highRes token={token} />
            </a>
          </div>
        )
      )}
      <StandardHeading
        heading={<NutshellLabel appearance={appearance} />}
        lead={
          <>
            {(appearance.guide ?? guide) ? (
              <>
                from the <GuideLink name={(appearance.guide ?? guide)!} title />
              </>
            ) : (
              'from a personal guide'
            )}
          </>
        }
      />
      <ButtonCollection>
        <Button
          tag="a"
          color="guide-link"
          href={getAppearanceFileUrl(appearance.id, 'image', { type: 'palette', format: 'png' }, token)}
          target="_blank"
          rel="noopener"
        >
          <InlineIcon icon="image" first />
          {t('colorGuide.appearance.viewPng')}
        </Button>
        <Button color="teal" onClick={() => setSwatchOpen(true)}>
          <InlineIcon icon="paint-brush" first />
          {t('colorGuide.appearance.downloadSwatch')}
        </Button>
        {shortUrl && <ShareAppearanceButton shortUrl={shortUrl} isPrivate={Boolean(appearance.token)} appearanceId={appearance.id} />}
        <AppearanceHeaderActions appearance={appearance} />
      </ButtonCollection>
      <SwatchDialog
        appearanceId={appearance.id}
        name={appearance.label}
        token={token}
        isOpen={swatchOpen}
        onClose={() => setSwatchOpen(false)}
      />

      <StatusAlert status={status} subject={t('colorGuide.appearance.subject')} />

      {appearance.token && (
        <Alert color="warning" fade={false} className="text-center" data-testid="private-notice">
          <InlineIcon icon="lock" first />
          <strong>{t('colorGuide.appearance.privateNotice', { who: privateWho })}</strong>
        </Alert>
      )}

      {appearance.ownerId === null && (
        <>
          {appearance.majorChanges && appearance.majorChanges.length > 0 && (
            <section id="major-changes">
              <h2>
                <InlineIcon icon="exclamation-triangle" first size="xs" />
                {t('colorGuide.appearance.majorChanges')}
              </h2>
              <ul>
                {appearance.majorChanges.map((change) => (
                  <li key={change.id}>
                    {change.reason} &ndash; <TimeAgo date={change.createdAt} />
                    {change.user && (
                      <>
                        {' '}
                        {t('colorGuide.appearance.changedBy')} <UserLink id={change.user.id} name={change.user.name} />
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {(appearance.tags.length > 0 || appearance.canEdit) && (
            <section id="tags">
              {editingTags && appearance.canEdit ? (
                <>
                  <h2>
                    <InlineIcon icon="tags" first size="xs" />
                    {t('colorGuide.appearance.tags')}
                  </h2>
                  <AppearanceTagEditor appearanceId={appearance.id} onClose={() => setEditingTags(false)} />
                </>
              ) : (
                <>
                  <AppearanceTags
                    tags={appearance.tags}
                    guide={appearance.guide ?? guide}
                    renderExtra={appearance.canEdit ? (tag) => <TagMenu tag={tag} appearanceId={appearance.id} /> : undefined}
                  />
                  {appearance.tags.length === 0 && (
                    <>
                      <h2>
                        <InlineIcon icon="tags" first size="xs" />
                        {t('colorGuide.appearance.tags')}
                      </h2>
                      <p>{t('colorGuide.appearance.noTags')}</p>
                    </>
                  )}
                  {appearance.canEdit && (
                    <ButtonCollection leftAlign>
                      <EditTagsButton onClick={() => setEditingTags(true)} />
                      <NewTagButton appearanceId={appearance.id} />
                    </ButtonCollection>
                  )}
                </>
              )}
            </section>
          )}
          {(appearance.relatedShows.length > 0 || appearance.canEdit) && (
            <section id="related-shows">
              <h2>
                <InlineIcon icon="video" first size="xs" />
                {t('colorGuide.appearance.featuredIn')}
              </h2>
              {appearance.relatedShows.length > 0 ? (
                <p>
                  {appearance.relatedShows.map((show, index) => (
                    <Fragment key={show.id}>
                      {index > 0 && ', '}
                      <Link href={PATHS.EPISODE(show)}>{formatShowHeading(show)}</Link>
                    </Fragment>
                  ))}
                </p>
              ) : (
                <p className="fst-italic text-muted">{t('colorGuide.appearance.noRelatedShows')}</p>
              )}
              <ButtonCollection leftAlign>
                <EditRelationsButton appearanceId={appearance.id} kind="shows" />
              </ButtonCollection>
            </section>
          )}
        </>
      )}
      <AppearanceNotes notes={appearance.notes} />
      <AppearanceCutieMarks
        appearanceId={appearance.id}
        label={appearance.label}
        cutieMarks={appearance.cutieMarks}
        colorGroups={appearance.colorGroups}
      />
      {appearance.canEdit && (
        <ButtonCollection leftAlign>
          <EditCutieMarksButton appearance={appearance} />
        </ButtonCollection>
      )}
      <AppearanceColorGroups
        colorGroups={appearance.colorGroups}
        appearanceId={appearance.id}
        canEdit={appearance.canEdit}
        appearanceLabel={appearance.label}
      />
      {appearance.ownerId === null && (appearance.relatedAppearances.length > 0 || appearance.canEdit) && (
        <section className="related">
          <h2>{t('colorGuide.appearance.relatedAppearances')}</h2>
          {appearance.relatedAppearances.length > 0 ? (
            <ul className="list-unstyled">
              {appearance.relatedAppearances.map((related) => (
                <li key={related.id}>
                  <AppearanceLink {...related} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="fst-italic text-muted">{t('colorGuide.appearance.noRelatedAppearances')}</p>
          )}
          <ButtonCollection leftAlign>
            <EditRelationsButton appearanceId={appearance.id} kind="relations" />
          </ButtonCollection>
        </section>
      )}
    </Content>
  );
};
