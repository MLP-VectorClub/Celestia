import { NextPage } from 'next';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { FC, useCallback, useMemo, useState } from 'react';
import { Button, DropdownItem, DropdownMenu, DropdownToggle, UncontrolledDropdown } from 'reactstrap';

import { GetAppearancesFullResult, GuideName } from '@mlp-vectorclub/api-types';
import FullGuideGroups from 'src/components/colorguide/FullGuideGroups';
import { FullGuideReorder } from 'src/components/colorguide/FullGuideReorder';
import { GuideNotFound } from 'src/components/colorguide/GuideNotFound';
import MajorChangesButton from 'src/components/colorguide/MajorChangesButton';
import ReturnToGuideButton from 'src/components/colorguide/ReturnToGuideButton';
import ButtonCollection from 'src/components/shared/ButtonCollection';
import Content from 'src/components/shared/Content';
import InlineIcon from 'src/components/shared/InlineIcon';
import StandardHeading from 'src/components/shared/StandardHeading';
import StatusAlert from 'src/components/shared/StatusAlert';
import { fullGuideFetcher } from 'src/fetchers';
import { useAuth, useFullGuide, useTitleSetter } from 'src/hooks';
import { PATHS } from 'src/paths';
import { useAppDispatch, wrapper } from 'src/store';
import { Nullable, Optional, Translatable } from 'src/types';
import { SSRMessages } from 'src/types';
import { FullGuideSortField } from 'src/types/api-alias';
import { TitleFactory } from 'src/types/title';
import {
  fullListSortOptionsMap,
  getGuideLabel,
  handleDataFetchingError,
  isValidFullListSortOption,
  notFound,
  resolveGuideName,
} from 'src/utils';
import { titleSetter } from 'src/utils/core';
import { typedServerSideTranslations } from 'src/utils/i18n';

interface PropTypes {
  guide: Nullable<GuideName>;
  sort: FullGuideSortField;
  initialData: Nullable<GetAppearancesFullResult>;
}

const titleFactory: TitleFactory<Pick<PropTypes, 'guide'>> = ({ guide }) => {
  const title: Translatable = ['colorGuide.fullList.title', { guideName: getGuideLabel(guide) }];
  const guideLinkProps = guide ? { href: PATHS.GUIDE(guide) } : undefined;
  return {
    title,
    breadcrumbs: [
      {
        linkProps: { href: PATHS.GUIDE_INDEX },
        label: ['colorGuide.index.breadcrumb'],
      },
      { linkProps: guideLinkProps, label: getGuideLabel(guide) },
      { label: 'Full List', active: true },
    ],
  };
};

const FullGuidePage: NextPage<PropTypes> = ({ guide, sort, initialData }) => {
  const t = useTranslations();
  const dispatch = useAppDispatch();
  const { isStaff } = useAuth();
  const [reordering, setReordering] = useState(false);
  const data = useFullGuide({ guide, sort }, initialData || undefined);
  const heading = t('colorGuide.fullList.heading', {
    guideName: getGuideLabel(guide),
  });

  const titleData = useMemo(() => titleFactory({ guide }), [guide]);
  useTitleSetter(dispatch, titleData);

  const SortDropdown: FC<{ sortI18n: FullGuideSortField }> = useCallback(
    ({ sortI18n }) => (
      <DropdownToggle color="white" className="fst-italic">
        {t(`colorGuide.fullList.sortOptions.${sortI18n}`)}
        <InlineIcon icon="caret-down" last />
      </DropdownToggle>
    ),
    [t]
  );

  if (guide === null) {
    return <GuideNotFound heading={heading} />;
  }

  const sortOptions = Object.keys(fullListSortOptionsMap) as Array<keyof typeof fullListSortOptionsMap>;

  return (
    <Content>
      <StandardHeading
        heading={heading}
        lead={
          <UncontrolledDropdown>
            {t.rich('colorGuide.fullList.lead', {
              dropdown: () => <SortDropdown sortI18n={sort} />,
            })}
            <DropdownMenu>
              <DropdownItem header>{t('colorGuide.fullList.sortOptionsHeader')}</DropdownItem>
              {sortOptions.map((sortBy) => (
                <Link key={sortBy} href={PATHS.GUIDE_FULL(guide, { sort_by: sortBy })} passHref legacyBehavior>
                  <DropdownItem tag="a" active={sortBy === sort}>
                    {t(`colorGuide.fullList.sortOptions.${sortBy}`)}
                  </DropdownItem>
                </Link>
              ))}
            </DropdownMenu>
          </UncontrolledDropdown>
        }
      />
      <ButtonCollection>
        <ReturnToGuideButton guide={guide} />
        {isStaff && (
          <Button
            color="ui"
            size="sm"
            disabled={sort !== 'relevance' || reordering || !data.appearances}
            onClick={() => setReordering(true)}
          >
            <InlineIcon icon="sort" first />
            {t('colorGuide.fullList.reorder')}
          </Button>
        )}
        <MajorChangesButton guide={guide} />
      </ButtonCollection>

      <StatusAlert status={data.status} subject="list of all entries" />
      {typeof data.appearances !== 'undefined' &&
        typeof data.groups !== 'undefined' &&
        (reordering ? (
          <FullGuideReorder guide={guide} appearances={data.appearances} groups={data.groups} onDone={() => setReordering(false)} />
        ) : (
          <FullGuideGroups appearances={data.appearances} groups={data.groups} />
        ))}
    </Content>
  );
};

export const getServerSideProps = wrapper.getServerSideProps<PropTypes & SSRMessages>((store) => async (ctx) => {
  const { query, locale } = ctx;

  const guide = resolveGuideName(query.guide) || null;
  if (!guide) {
    return notFound(ctx);
  }

  const sort: FullGuideSortField = isValidFullListSortOption(query.sort_by) ? query.sort_by : 'relevance';

  let initialData: Optional<GetAppearancesFullResult>;
  if (guide) {
    try {
      initialData = await fullGuideFetcher({ guide, sort })();
    } catch (e) {
      handleDataFetchingError(ctx, e);
    }
  }

  const props: PropTypes = {
    guide,
    sort,
    initialData: initialData || null,
  };
  titleSetter(store, titleFactory(props));
  return {
    props: {
      ...(await typedServerSideTranslations(locale, ['colorGuide'])),
      ...props,
    },
  };
});

export default FullGuidePage;
