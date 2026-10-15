import { NextPage } from 'next';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

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
    <>
      {/* The tool fills the page like the old site's, the heading stays for screen readers and search engines */}
      <h1 className="visually-hidden">{t('colorGuide.picker.title')}</h1>
      <p className="visually-hidden">{t('colorGuide.picker.lead')}</p>
      <PickerTool />
    </>
  );
};

export const getServerSideProps = wrapper.getServerSideProps<SSRMessages>((store) => async ({ locale }) => {
  titleSetter(store, titleFactory());
  return { props: { ...(await typedServerSideTranslations(locale, ['colorGuide', 'picker'])), mainPadding: false } };
});

export default PickerPage;
