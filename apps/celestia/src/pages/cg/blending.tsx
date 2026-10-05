import { NextPage } from 'next';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useMemo } from 'react';
import { Alert, Button } from 'reactstrap';

import Content from 'src/components/shared/Content';
import ExternalLink from 'src/components/shared/ExternalLink';
import InlineIcon from 'src/components/shared/InlineIcon';
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
      <StandardHeading
        heading={t('colorGuide.blending.title')}
        lead={t.rich('colorGuide.blending.lead', {
          author: (chunks) => <ExternalLink href="https://www.deviantart.com/dasprid">{chunks}</ExternalLink>,
        })}
      />
      <Alert color="info" className="text-center">
        <p>
          <InlineIcon icon="info-circle" first />
          {t('colorGuide.blending.info')}
        </p>
        <p>{t.rich('colorGuide.blending.hint', { strong: (chunks) => <strong>{chunks}</strong> })}</p>
        <Button tag={Link} href={PATHS.GUIDE_INDEX} color="guide-link">
          <InlineIcon icon="arrow-circle-left" first />
          {t('colorGuide.blending.back')}
        </Button>
      </Alert>
      <BlendingTool />
    </Content>
  );
};

export const getServerSideProps = wrapper.getServerSideProps<SSRMessages>((store) => async ({ locale }) => {
  titleSetter(store, titleFactory());
  return { props: { ...(await typedServerSideTranslations(locale, ['colorGuide', 'tools'])) } };
});

export default BlendingPage;
