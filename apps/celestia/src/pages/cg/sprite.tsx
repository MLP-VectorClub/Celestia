import { NextPage } from 'next';
import Content from 'src/components/shared/Content';
import StandardHeading from 'src/components/shared/StandardHeading';
import { SpriteGenerator } from 'src/components/colorguide/sprite-generator/SpriteGenerator';
import { TitleFactory } from 'src/types/title';
import { useMemo } from 'react';
import { PATHS } from 'src/paths';
import Head from 'next/head';
import { assembleSeoUrl } from 'src/utils';
import { useTitleSetter } from 'src/hooks';
import { useAppDispatch, wrapper } from 'src/store';
import { titleSetter } from 'src/utils/core';
import { Translatable } from 'src/types';
import { useTranslation } from 'next-i18next/pages';
import { typedServerSideTranslations } from 'src/utils/i18n';

const titleFactory: TitleFactory = () => {
  const title: Translatable = ['colorGuide:sprite.title'];
  return {
    title,
    breadcrumbs: [
      {
        linkProps: { href: PATHS.GUIDE_INDEX },
        label: ['colorGuide:index.breadcrumb'],
      },
      { label: title, active: true },
    ],
  };
};

const SpriteGeneratorPage: NextPage = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const titleData = useMemo(titleFactory, []);
  useTitleSetter(dispatch, titleData);
  return (
    <Content>
      <StandardHeading heading={t('colorGuide:sprite.title')} lead="Create your own pony sprite images based on our template" />
      <SpriteGenerator />
      <Head>
        <meta name="description" content="Create your own pixelated pony reference images using the MLP Vector Club's template generator" />
        <meta property="og:image" content={assembleSeoUrl('/img/default-sprite.png')} />
        <meta property="og:image:width" content="300" />
        <meta property="og:image:height" content="300" />
      </Head>
    </Content>
  );
};

export default SpriteGeneratorPage;

export const getStaticProps = wrapper.getStaticProps((store) => async ({ locale }) => {
  titleSetter(store, titleFactory());
  return {
    props: {
      ...(await typedServerSideTranslations(locale, ['colorGuide'])),
    },
  };
});
