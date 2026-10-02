import { useTranslations } from 'next-intl';
import Head from 'next/head';
import Link from 'next/link';
import { FC, useMemo } from 'react';
import { Button } from 'reactstrap';

import { DetailedAppearance, GuideName } from '@mlp-vectorclub/api-types';
import styles from 'modules/AppearancePage.module.scss';
import { AppearanceColorGroups } from 'src/components/colorguide/AppearanceColorGroups';
import { AppearanceCutieMarks } from 'src/components/colorguide/AppearanceCutieMarks';
import { AppearanceEditActions } from 'src/components/colorguide/AppearanceEditActions';
import { AppearanceLink } from 'src/components/colorguide/AppearanceLink';
import { AppearanceNotes } from 'src/components/colorguide/AppearanceNotes';
import AppearanceTags from 'src/components/colorguide/AppearanceTags';
import { GuideLink } from 'src/components/colorguide/GuideLink';
import { GuideNotFound } from 'src/components/colorguide/GuideNotFound';
import { ShareAppearanceButton } from 'src/components/colorguide/ShareAppearanceButton';
import SpriteImage from 'src/components/colorguide/SpriteImage';
import ButtonCollection from 'src/components/shared/ButtonCollection';
import Content from 'src/components/shared/Content';
import InlineIcon from 'src/components/shared/InlineIcon';
import StandardHeading from 'src/components/shared/StandardHeading';
import StatusAlert from 'src/components/shared/StatusAlert';
import { APP_HOST } from 'src/config';
import { useDetailedAppearance } from 'src/hooks';
import { PATHS } from 'src/paths';
import { Nullable } from 'src/types';
import { assembleSeoUrl } from 'src/utils';
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
  const { appearance, status } = useDetailedAppearance({ id }, initialAppearance || undefined);

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
    return <GuideNotFound heading="Unknown appearance" noun="appearance" />;
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
      {appearance.sprite && (
        <div className={styles.spriteImage}>
          <SpriteImage appearanceId={appearance.id} sprite={appearance.sprite} height={300} />
        </div>
      )}
      <StandardHeading
        heading={appearance.label}
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
        <Button color="link" size="sm" disabled>
          <InlineIcon icon="image" first />
          {t('colorGuide.appearance.viewPng')}
        </Button>
        <Button color="primary" size="sm" disabled>
          <InlineIcon icon="paint-brush" first />
          {t('colorGuide.appearance.downloadSwatch')}
        </Button>
        {shortUrl && <ShareAppearanceButton shortUrl={shortUrl} />}
        <AppearanceEditActions appearance={appearance} />
      </ButtonCollection>

      <StatusAlert status={status} subject="appearance" />

      <AppearanceTags tags={appearance.tags} guide={appearance.guide ?? guide} />
      <h2>
        <InlineIcon icon="video" first size="xs" />
        {t('colorGuide.appearance.featuredIn')}
      </h2>
      {appearance.relatedShows.length === 0 ? (
        <p className="text-muted">{t('colorGuide.appearance.noShows')}</p>
      ) : (
        <ul>
          {appearance.relatedShows.map((show) => (
            <li key={show.id}>
              <Link href={PATHS.EPISODE(show)}>{show.title}</Link>
            </li>
          ))}
        </ul>
      )}
      <AppearanceNotes notes={appearance.notes} />
      <AppearanceCutieMarks label={appearance.label} cutieMarks={appearance.cutieMarks} colorGroups={appearance.colorGroups} />
      <AppearanceColorGroups colorGroups={appearance.colorGroups} appearanceId={appearance.id} canEdit={appearance.canEdit} />
      <h2>{t('colorGuide.appearance.relatedAppearances')}</h2>
      {appearance.relatedAppearances.length === 0 ? (
        <p className="text-muted">{t('colorGuide.appearance.noRelated')}</p>
      ) : (
        <ul className="list-unstyled">
          {appearance.relatedAppearances.map((related) => (
            <li key={related.id}>
              <AppearanceLink {...related} />
            </li>
          ))}
        </ul>
      )}
    </Content>
  );
};
