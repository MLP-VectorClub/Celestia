import { NextPage } from 'next';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { useDispatch } from 'react-redux';

import Content from 'src/components/shared/Content';
import StandardHeading from 'src/components/shared/StandardHeading';
import { useTitleSetter } from 'src/hooks';
import { AppDispatch, wrapper } from 'src/store';
import { Nullable, Translatable } from 'src/types';
import { TitleFactory } from 'src/types/title';
import { titleSetter } from 'src/utils/core';
import { typedServerSideTranslations } from 'src/utils/i18n';

interface PropTypes {
  statusCode?: Nullable<number>;
}

const titleFactory: TitleFactory = () => {
  const title: Translatable = ['common.error.withoutStatus'];
  return {
    title,
    breadcrumbs: [{ label: 'Error' }, { label: title, active: true }],
  };
};

const Error: NextPage<PropTypes> = () => {
  const t = useTranslations();
  const dispatch = useDispatch<AppDispatch>();

  const titleData = useMemo(titleFactory, []);
  useTitleSetter(dispatch, titleData);

  return (
    <Content>
      <StandardHeading heading={t('common.error.withoutStatus')} />
    </Content>
  );
};

export const getStaticProps = wrapper.getStaticProps((store) => async ({ locale }) => {
  titleSetter(store, titleFactory());
  return {
    props: {
      ...(await typedServerSideTranslations(locale)),
    },
  };
});

export default Error;
