import { StatusCodes } from 'http-status-codes';
import { NextPage } from 'next';
import { useMemo } from 'react';

import { DetailedAppearance, GetAppearancesIdResult, GuideName } from '@mlp-vectorclub/api-types';
import { AppearanceView } from 'src/components/colorguide/AppearanceView';
import { appearanceFetcher } from 'src/fetchers';
import { useTitleSetter } from 'src/hooks';
import { PATHS } from 'src/paths';
import { useAppDispatch, wrapper } from 'src/store';
import { BreadcrumbEntry, Nullable, Optional, SSRMessages } from 'src/types';
import { TitleFactory } from 'src/types/title';
import { getAppearanceTitle, getGuideLabel, handleDataFetchingError, notFound, resolveGuideName } from 'src/utils';
import { titleSetter } from 'src/utils/core';
import { typedServerSideTranslations } from 'src/utils/i18n';
import { canonicalPathRedirect } from 'src/utils/url';

interface PropTypes {
  guide: GuideName;
  id: number | null;
  initialData: {
    appearance: Nullable<DetailedAppearance>;
  };
}

const titleFactory: TitleFactory<Pick<PropTypes, 'guide' | 'initialData'>> = ({ guide, initialData }) => {
  const title = getAppearanceTitle(guide, initialData.appearance);
  const guideItem =
    guide !== null
      ? {
          label: getGuideLabel(guide),
          linkProps: { href: PATHS.GUIDE(guide) },
        }
      : { label: getGuideLabel(guide) };
  const breadcrumbs: BreadcrumbEntry[] = [
    {
      linkProps: { href: PATHS.GUIDE_INDEX },
      label: ['colorGuide.index.breadcrumb'],
    },
    guideItem,
  ];
  if (initialData.appearance) {
    breadcrumbs.push({ label: initialData.appearance.label, active: true });
  } else {
    breadcrumbs.push({ label: 'Appearance', active: true });
  }
  return {
    title,
    breadcrumbs,
  };
};

const AppearancePage: NextPage<PropTypes> = ({ guide, id, initialData }) => {
  const dispatch = useAppDispatch();
  const titleData = useMemo(() => titleFactory({ initialData, guide }), [guide, initialData]);
  useTitleSetter(dispatch, titleData);

  return <AppearanceView guide={guide} id={id} initialAppearance={initialData.appearance} />;
};

export const getServerSideProps = wrapper.getServerSideProps<PropTypes & SSRMessages>((store) => async (ctx) => {
  const { query, req, locale } = ctx;

  const guide = resolveGuideName(query.guide) || null;
  if (!guide) {
    return notFound(ctx);
  }

  let id: number | null = null;
  if (typeof query.id === 'string') {
    id = Number.parseInt(query.id.trim(), 10);
  }

  let appearance: Optional<GetAppearancesIdResult>;
  if (guide && id !== null) {
    try {
      appearance = await appearanceFetcher({ id, token: typeof query.token === 'string' ? query.token : undefined }, req)();
    } catch (e) {
      handleDataFetchingError(ctx, e);
    }
  }

  // Like the old site, an address without the name (or with another one) goes to the canonical one
  if (appearance && appearance.ownerId === null) {
    const canonical = canonicalPathRedirect(ctx.resolvedUrl, PATHS.APPEARANCE(appearance));
    if (canonical) return { redirect: { destination: canonical, statusCode: StatusCodes.MOVED_PERMANENTLY } };
  }

  const props: PropTypes = {
    guide,
    id,
    initialData: {
      appearance: appearance || null,
    },
  };
  titleSetter(store, titleFactory(props));
  return {
    props: {
      ...(await typedServerSideTranslations(locale, ['colorGuide'])),
      ...props,
    },
  };
});

export default AppearancePage;
