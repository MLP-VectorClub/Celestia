import { GetAppearancesIdResult } from '@went.tf/mlp-vectorclub-api-types';
import { NextPage } from 'next';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useMemo } from 'react';
import { Alert } from 'reactstrap';

import { SpriteColorsReport } from 'src/components/colorguide/SpriteColorsReport';
import Content from 'src/components/shared/Content';
import InlineIcon from 'src/components/shared/InlineIcon';
import StandardHeading from 'src/components/shared/StandardHeading';
import { appearanceFetcher } from 'src/fetchers';
import { useTitleSetter } from 'src/hooks';
import { PATHS } from 'src/paths';
import { useAppDispatch, wrapper } from 'src/store';
import { Optional, SSRMessages } from 'src/types';
import { TitleFactory } from 'src/types/title';
import { handleDataFetchingError, notFound } from 'src/utils';
import { titleSetter } from 'src/utils/core';
import { typedServerSideTranslations } from 'src/utils/i18n';
import { appearanceShareUrl } from 'src/utils/share-url';

interface PropTypes {
  id: number;
  token?: string;
  appearance: {
    id: number;
    label: string;
    guide: GetAppearancesIdResult['guide'];
    ownerId: number | null;
    hasSprite: boolean;
  };
}

const titleFactory: TitleFactory<Pick<PropTypes, 'appearance' | 'token'>> = ({ appearance, token }) => ({
  title: `${appearance.label} - Sprite colors`,
  breadcrumbs: [
    { label: ['colorGuide.index.breadcrumb'], linkProps: { href: PATHS.GUIDE_INDEX } },
    { label: appearance.label, linkProps: { href: appearanceShareUrl(PATHS.APPEARANCE(appearance), token) } },
    { label: ['colorGuide.spriteColors.breadcrumb'], active: true },
  ],
});

/** The old site's sprite color checker, now showing every color of the sprite and where it comes from */
const SpriteColorsPage: NextPage<PropTypes> = ({ token, appearance }) => {
  const t = useTranslations();
  const dispatch = useAppDispatch();
  const titleData = useMemo(() => titleFactory({ appearance, token }), [appearance, token]);
  useTitleSetter(dispatch, titleData);

  return (
    <Content>
      <StandardHeading
        heading={t('colorGuide.spriteColors.heading')}
        lead={t('colorGuide.spriteColors.lead', { label: appearance.label })}
      />
      <p className="text-center">
        <Link href={appearanceShareUrl(PATHS.APPEARANCE(appearance), token)} className="btn btn-link">
          <InlineIcon first icon="chevron-left" />
          {t('colorGuide.spriteColors.backToAppearance')}
        </Link>
      </p>
      <p className="text-muted">{t('colorGuide.spriteColors.intro')}</p>
      {appearance.hasSprite ? (
        <SpriteColorsReport appearanceId={appearance.id} label={appearance.label} token={token} />
      ) : (
        <Alert color="info" fade={false}>
          {t('colorGuide.spriteColors.noSprite')}
        </Alert>
      )}
    </Content>
  );
};

export const getServerSideProps = wrapper.getServerSideProps<PropTypes & SSRMessages>((store) => async (ctx) => {
  const { query, req, locale } = ctx;

  const id = typeof query.id === 'string' && /^\d+$/.test(query.id) ? Number.parseInt(query.id, 10) : null;
  if (id === null) return notFound(ctx);
  const token = typeof query.token === 'string' && query.token !== '' ? query.token : undefined;

  let found: Optional<GetAppearancesIdResult>;
  try {
    found = await appearanceFetcher({ id, token }, req)();
  } catch (e) {
    handleDataFetchingError(ctx, e);
  }
  if (!found) return notFound(ctx);

  const appearance: PropTypes['appearance'] = {
    id: found.id,
    label: found.label,
    guide: found.guide,
    ownerId: found.ownerId ?? null,
    hasSprite: Boolean(found.sprite),
  };
  titleSetter(store, titleFactory({ appearance, token }));
  return {
    props: {
      ...(await typedServerSideTranslations(locale, ['colorGuide'])),
      id,
      ...(token ? { token } : {}),
      appearance,
    },
  };
});

export default SpriteColorsPage;
