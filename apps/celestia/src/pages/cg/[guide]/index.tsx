import { NextPage } from 'next';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { Button } from 'reactstrap';

import { GetAppearancesPinnedResult, GetAppearancesResult, GuideName } from '@mlp-vectorclub/api-types';
import { useColorCopyWidget } from 'src/components/colorguide/ColorCopyWidget';
import { AppearanceCreateButton } from 'src/components/colorguide/AppearanceCreateButton';
import AppearanceItem from 'src/components/colorguide/AppearanceItem';
import { GuideNotFound } from 'src/components/colorguide/GuideNotFound';
import MajorChangesButton from 'src/components/colorguide/MajorChangesButton';
import PinnedAppearances from 'src/components/colorguide/PinnedAppearances';
import SearchBar from 'src/components/colorguide/SearchBar';
import ButtonCollection from 'src/components/shared/ButtonCollection';
import ContactLink from 'src/components/shared/ContactLink';
import Content from 'src/components/shared/Content';
import ExternalLink from 'src/components/shared/ExternalLink';
import InlineIcon from 'src/components/shared/InlineIcon';
import NoResultsAlert from 'src/components/shared/NoResultsAlert';
import Pagination from 'src/components/shared/Pagination';
import StandardHeading from 'src/components/shared/StandardHeading';
import StatusAlert from 'src/components/shared/StatusAlert';
import { guideFetcher, pinnedAppearancesFetcher } from 'src/fetchers/color-guide';
import { useAuth, useGuide, usePrefs, useTitleSetter } from 'src/hooks';
import { PATHS } from 'src/paths';
import { AppDispatch, wrapper } from 'src/store';
import { Nullable, Optional, SSRMessages } from 'src/types';
import { TitleFactory } from 'src/types/title';
import { getGuideLabel, getGuideTitle, handleDataFetchingError, notFound, resolveGuideName } from 'src/utils';
import { titleSetter } from 'src/utils/core';
import { typedServerSideTranslations } from 'src/utils/i18n';
import { validatePageParam } from 'src/utils/validate-page-param';

const titleFactory: TitleFactory<Omit<PropTypes, 'initialData'>> = ({ guide, page, q }) => {
  const title = getGuideTitle(guide, page, q);
  return {
    title,
    breadcrumbs: [
      {
        linkProps: { href: PATHS.GUIDE_INDEX },
        label: ['colorGuide.index.breadcrumb'],
      },
      { label: getGuideLabel(guide), active: true },
    ],
  };
};

interface PropTypes {
  guide: Nullable<GuideName>;
  page: number;
  q: string;
  initialData: {
    appearances: Nullable<GetAppearancesResult>;
    pinnedAppearances: Nullable<GetAppearancesPinnedResult>;
  };
}

const PAGING_RELEVANT_PROPS = ['q'];

const ColorGuidePage: NextPage<PropTypes> = ({ guide, page, q, initialData }) => {
  const t = useTranslations();
  const dispatch = useDispatch<AppDispatch>();
  const { isStaff, signedIn } = useAuth();
  const prefs = usePrefs(signedIn);
  const size = prefs?.cg_itemsperpage || initialData.appearances?.pagination.itemsPerPage;
  const data = useGuide({ guide, page, q, size }, initialData.appearances || undefined);
  const heading = getGuideTitle(guide);

  const titleData = useMemo(() => titleFactory({ guide, page, q }), [guide, page, q]);
  useTitleSetter(dispatch, titleData);
  useColorCopyWidget();

  if (guide === null) {
    return <GuideNotFound heading={heading} />;
  }

  const lead = t('colorGuide.guide.lead', { source: guide === 'eqg' ? 'movies' : 'series' });

  return (
    <Content>
      <StandardHeading heading={heading} lead={lead} />
      <p className="text-center">
        {t.rich('colorGuide.guide.demand', { contact: (chunks) => <ContactLink>{chunks}</ContactLink> })}
        <br />
        <small>
          {t.rich('colorGuide.guide.oldGuides', {
            pony: (chunks) => <ExternalLink href="https://sta.sh/0kic0ngp3fy">{chunks}</ExternalLink>,
            eqg: (chunks) => <ExternalLink href="http://fav.me/d7120l1">{chunks}</ExternalLink>,
          })}
        </small>
        <br />
        {t.rich('colorGuide.guide.movedLinks', { list: (chunks) => <Link href={PATHS.GUIDE_INDEX}>{chunks}</Link> })}
      </p>
      <ButtonCollection>
        {isStaff && <AppearanceCreateButton guide={guide} kind={guide === 'eqg' ? 'character' : 'pony'} />}
        <Link href={PATHS.GUIDE_FULL(guide)} passHref legacyBehavior>
          <Button color="guide-link" size="sm">
            <InlineIcon icon="bars" first />
            {t('colorGuide.guide.fullList')}
          </Button>
        </Link>
        <MajorChangesButton guide={guide} />
      </ButtonCollection>

      <PinnedAppearances initialData={initialData.pinnedAppearances} guide={guide} />

      <SearchBar guide={guide} initialQuery={q} />

      <StatusAlert status={data.status} subject={t('colorGuide.guide.entriesSubject')} />
      {data.appearances?.length === 0 && <NoResultsAlert message={t('colorGuide.guide.empty')} />}
      {data.pagination && <Pagination {...data.pagination} relevantProps={PAGING_RELEVANT_PROPS} tooltipPos="bottom" />}
      {data.appearances && data.appearances.map((el) => <AppearanceItem key={el.id} appearance={el} guide={guide} />)}
      {data.pagination && <Pagination {...data.pagination} relevantProps={PAGING_RELEVANT_PROPS} tooltipPos="top" listClassName="mb-0" />}
    </Content>
  );
};

export const getServerSideProps = wrapper.getServerSideProps<PropTypes & SSRMessages>((store) => async (ctx) => {
  const { query, req, locale } = ctx;

  const guide = resolveGuideName(query.guide) || null;
  if (!guide) {
    notFound(ctx);
  }

  const page = validatePageParam(query.page);

  let q = '';
  if (typeof query.q === 'string') {
    q = query.q.trim();
  }

  let appearances: Optional<GetAppearancesResult>;
  let pinnedAppearances: Optional<GetAppearancesPinnedResult>;
  if (guide) {
    try {
      appearances = await guideFetcher({ q, guide, page }, req)();
    } catch (e) {
      handleDataFetchingError(ctx, e);
    }

    try {
      pinnedAppearances = await pinnedAppearancesFetcher({ ...query, guide }, req)();
    } catch (e) {
      handleDataFetchingError(ctx, e);
    }
  }

  const props: PropTypes = {
    guide,
    page,
    q,
    initialData: {
      appearances: appearances || null,
      pinnedAppearances: pinnedAppearances || null,
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

export default ColorGuidePage;
