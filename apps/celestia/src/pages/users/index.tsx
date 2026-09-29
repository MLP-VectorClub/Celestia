import { NextPage } from 'next';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { GetAboutMembersResult } from '@mlp-vectorclub/api-types';
import styles from 'modules/UsersIndexPage.module.scss';
import Content from 'src/components/shared/Content';
import StandardHeading, { StandardHeadingProps } from 'src/components/shared/StandardHeading';
import MemberList from 'src/components/users/MemberList';
import { UserList } from 'src/components/users/UserList';
import { membersFetcher } from 'src/fetchers';
import { useAuth, useTitleSetter } from 'src/hooks';
import { useAppDispatch, wrapper } from 'src/store';
import { Nullable, Optional, Translatable } from 'src/types';
import { TitleFactory } from 'src/types/title';
import { handleDataFetchingError } from 'src/utils';
import { titleSetter } from 'src/utils/core';
import { typedServerSideTranslations } from 'src/utils/i18n';

const titleFactory: TitleFactory<{ isStaff?: boolean }> = ({ isStaff = false }) => {
  const title: Translatable = [isStaff ? 'common.titles.users' : 'common.titles.clubMembers'];
  return {
    title,
    breadcrumbs: [
      {
        label: title,
        active: true,
      },
    ],
  };
};

interface PropTypes {
  initialMembers: Nullable<GetAboutMembersResult>;
}

const UsersIndexPage: NextPage<PropTypes> = ({ initialMembers }) => {
  const t = useTranslations();
  const dispatch = useAppDispatch();
  const { isStaff } = useAuth();

  const titleData = useMemo(() => titleFactory({ isStaff }), [isStaff]);
  useTitleSetter(dispatch, titleData);

  const headingProps: StandardHeadingProps = {
    heading: isStaff ? t(`users.memberList.staff.heading`) : t(`users.memberList.public.heading`),
    lead: isStaff ? t(`users.memberList.staff.lead`) : t(`users.memberList.public.lead`),
  };

  return (
    <Content className={styles.usersPageContent}>
      <StandardHeading {...headingProps} />
      <MemberList initialMembers={initialMembers || undefined} isStaff={isStaff} />
      <UserList enabled={isStaff} />
    </Content>
  );
};

export const getServerSideProps = wrapper.getServerSideProps((store) => async (ctx) => {
  const { locale } = ctx;

  let initialMembers: Optional<GetAboutMembersResult>;
  try {
    initialMembers = await membersFetcher();
  } catch (e) {
    handleDataFetchingError(ctx, e);
  }

  const props: PropTypes = {
    initialMembers: initialMembers || null,
  };
  titleSetter(store, titleFactory({}));
  return {
    props: {
      ...(await typedServerSideTranslations(locale, ['users'])),
      ...props,
    },
  };
});

export default UsersIndexPage;
