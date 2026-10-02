import { NextPage } from 'next';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import Content from 'src/components/shared/Content';
import StandardHeading from 'src/components/shared/StandardHeading';
import { BlendingTool } from 'src/components/tools/blending/BlendingTool';
import { useTitleSetter } from 'src/hooks';
import { PATHS } from 'src/paths';
import { useAppDispatch, wrapper } from 'src/store';
import { Translatable } from 'src/types';
import { SSRMessages } from 'src/types';
import { TitleFactory } from 'src/types/title';
import { titleSetter } from 'src/utils/core';
import { typedServerSideTranslations } from 'src/utils/i18n';

const titleFactory: TitleFactory = () => {
  const title: Translatable = ['colorGuide.blending.title'];
  return {
    title,
    breadcrumbs: [
      { linkProps: { href: PATHS.GUIDE_INDEX }, label: ['colorGuide.index.breadcrumb'] },
      { label: title, active: true },
    ],
  };
};

const BlendingPage: NextPage = () => {
  const t = useTranslations();
  const dispatch = useAppDispatch();
  const titleData = useMemo(titleFactory, []);
  useTitleSetter(dispatch, titleData);

  return (
    <Content>
      <StandardHeading heading={t('colorGuide.blending.title')} lead={t('colorGuide.blending.lead')} />
      <p className="text-center text-muted">{t('colorGuide.blending.hint')}</p>
      <BlendingTool />
    </Content>
  );
};

export const getServerSideProps = wrapper.getServerSideProps<SSRMessages>((store) => async ({ locale }) => {
  titleSetter(store, titleFactory());
  return { props: { ...(await typedServerSideTranslations(locale, ['colorGuide', 'tools'])) } };
});

export default BlendingPage;
