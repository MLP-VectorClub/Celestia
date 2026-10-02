import { NextPage } from 'next';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import Content from 'src/components/shared/Content';
import StandardHeading from 'src/components/shared/StandardHeading';
import { PickerTool } from 'src/components/tools/picker/PickerTool';
import { useTitleSetter } from 'src/hooks';
import { PATHS } from 'src/paths';
import { useAppDispatch, wrapper } from 'src/store';
import { SSRMessages, Translatable } from 'src/types';
import { TitleFactory } from 'src/types/title';
import { titleSetter } from 'src/utils/core';
import { typedServerSideTranslations } from 'src/utils/i18n';

const titleFactory: TitleFactory = () => {
  const title: Translatable = ['colorGuide.picker.title'];
  return {
    title,
    breadcrumbs: [
      { linkProps: { href: PATHS.GUIDE_INDEX }, label: ['colorGuide.index.breadcrumb'] },
      { label: title, active: true },
    ],
  };
};

const PickerPage: NextPage = () => {
  const t = useTranslations();
  const dispatch = useAppDispatch();
  const titleData = useMemo(titleFactory, []);
  useTitleSetter(dispatch, titleData);

  return (
    <Content>
      <StandardHeading heading={t('colorGuide.picker.title')} lead={t('colorGuide.picker.lead')} />
      <PickerTool />
    </Content>
  );
};

export const getServerSideProps = wrapper.getServerSideProps<SSRMessages>((store) => async ({ locale }) => {
  titleSetter(store, titleFactory());
  return { props: { ...(await typedServerSideTranslations(locale, ['colorGuide', 'picker'])) } };
});

export default PickerPage;
