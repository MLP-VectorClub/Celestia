import { useTranslations } from 'next-intl';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FC, Fragment, useMemo, useState } from 'react';
import { Button } from 'reactstrap';

import { DetailedAppearance, GuideName } from '@mlp-vectorclub/api-types';
import styles from 'modules/AppearancePage.module.scss';
import { useColorCopyWidget } from 'src/components/colorguide/ColorCopyWidget';
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
import AppearanceTags from 'src/components/colorguide/AppearanceTags';
import { GuideLink } from 'src/components/colorguide/GuideLink';
import { GuideNotFound } from 'src/components/colorguide/GuideNotFound';
import { NutshellLabel } from 'src/components/colorguide/NutshellLabel';
import { TagMenu, TagsMenu } from 'src/components/colorguide/TagStaffMenus';
import { SwatchDialog } from 'src/components/colorguide/SwatchDialog';
import { ShareAppearanceButton } from 'src/components/colorguide/ShareAppearanceButton';
import SpriteImage from 'src/components/colorguide/SpriteImage';
import { SpriteWrap } from 'src/components/colorguide/SpriteWrap';
import ButtonCollection from 'src/components/shared/ButtonCollection';
import Content from 'src/components/shared/Content';
import InlineIcon from 'src/components/shared/InlineIcon';
import StandardHeading from 'src/components/shared/StandardHeading';
import StatusAlert from 'src/components/shared/StatusAlert';
import { API_PREFIX } from 'src/config';
import { APP_HOST } from 'src/config';
import { useDetailedAppearance } from 'src/hooks';
import { PATHS } from 'src/paths';
import { Nullable } from 'src/types';
import { assembleSeoUrl } from 'src/utils';
import { formatShowHeading } from 'src/utils/show';
import { getSpriteUrl } from 'src/utils/color-guide';

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
  const shortUrl = useMemo(() => appearance && assembleSeoUrl(PATHS.SHORT_APPEARANCE(appearance)), [appearance]);

  if (!appearance) {
    return <GuideNotFound heading={t('colorGuide.notFound.unknownAppearance')} noun={t('colorGuide.notFound.nouns.appearance')} />;
  }

  return (
    <Content>
      {seoData && (
        <Head>
          <meta name="description" content={seoData.description} />
          <link rel="canonical" href={seoData.canonical} />
          {seoData.ogImage && (
            <>
              <meta property="og:image" content={seoData.ogImage.url} />
              <meta property="og:image:width" content={String(seoData.ogImage.width)} />
              <meta property="og:image:height" content={String(seoData.ogImage.height)} />
            </>
          )}
        </Head>
      )}
      {appearance.canEdit ? (
        <SpriteWrap appearanceId={appearance.id} sprite={appearance.sprite} />
      ) : (
        appearance.sprite && (
          <div className={styles.spriteImage}>
            <a href={getSpriteUrl(appearance.id, appearance.sprite, 600)} target="_blank" rel="noopener" title={t('colorGuide.edit.sprite.openInNewTab')}>
              <SpriteImage appearanceId={appearance.id} sprite={appearance.sprite} height={600} />
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
          href={`${API_PREFIX}/appearances/${appearance.id}/image?type=palette&format=png`}
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
        {shortUrl && <ShareAppearanceButton shortUrl={shortUrl} />}
        <AppearanceHeaderActions appearance={appearance} />
      </ButtonCollection>
      <SwatchDialog appearanceId={appearance.id} name={appearance.label} isOpen={swatchOpen} onClose={() => setSwatchOpen(false)} />

      <StatusAlert status={status} subject={t('colorGuide.appearance.subject')} />

      {appearance.ownerId === null && (
        <>
          {(appearance.tags.length > 0 || appearance.canEdit) && (
            <section id="tags">
              <AppearanceTags
                tags={appearance.tags}
                guide={appearance.guide ?? guide}
                renderExtra={appearance.canEdit ? (tag) => <TagMenu tag={tag} appearanceId={appearance.id} /> : undefined}
              />
              {appearance.canEdit && (
                <ButtonCollection leftAlign>
                  <EditTagsButton appearanceId={appearance.id} />
                  <TagsMenu appearanceId={appearance.id} />
                </ButtonCollection>
              )}
            </section>
          )}
          <section id="related-shows">
            <h2>
              <InlineIcon icon="video" first size="xs" />
              {t('colorGuide.appearance.featuredIn')}
            </h2>
            <p>
              {appearance.relatedShows.map((show, index) => (
                <Fragment key={show.id}>
                  {index > 0 && ', '}
                  <Link href={PATHS.EPISODE(show)}>{formatShowHeading(show)}</Link>
                </Fragment>
              ))}
            </p>
            <ButtonCollection leftAlign>
              <EditRelationsButton appearanceId={appearance.id} kind="shows" />
            </ButtonCollection>
          </section>
        </>
      )}
      <AppearanceNotes notes={appearance.notes} />
      <AppearanceCutieMarks label={appearance.label} cutieMarks={appearance.cutieMarks} colorGroups={appearance.colorGroups} />
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
          <ul className="list-unstyled">
            {appearance.relatedAppearances.map((related) => (
              <li key={related.id}>
                <AppearanceLink {...related} />
              </li>
            ))}
          </ul>
          <ButtonCollection leftAlign>
            <EditRelationsButton appearanceId={appearance.id} kind="relations" />
          </ButtonCollection>
        </section>
      )}
    </Content>
  );
};
