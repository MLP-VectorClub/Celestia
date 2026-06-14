import { useMemo } from 'react';
import Content from 'src/components/shared/Content';
import StandardHeading from 'src/components/shared/StandardHeading';
import { AppDispatch, wrapper } from 'src/store';
import { TitleFactory } from 'src/types/title';
import { titleSetter } from 'src/utils/core';
import { useTitleSetter } from 'src/hooks';
import { useDispatch } from 'react-redux';
import { NextPage } from 'next';
import { Translatable } from 'src/types';
import { useTranslations } from 'next-intl';
import { typedServerSideTranslations } from 'src/utils/i18n';

const titleFactory: TitleFactory = () => {
  const title: Translatable = ['common.titles.404'];
  return {
    title,
    breadcrumbs: [{ label: 'Error' }, { label: title, active: true }],
  };
};

const NotFound: NextPage = () => {
  const t = useTranslations();
  const dispatch = useDispatch<AppDispatch>();

  const titleData = useMemo(titleFactory, []);
  useTitleSetter(dispatch, titleData);

  return (
    <Content>
      <StandardHeading heading={t('common.error.404.heading')} lead={t('common.error.404.lead')} />
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

export default NotFound;
