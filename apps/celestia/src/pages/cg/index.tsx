import { NextPage } from 'next';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import pluralize from 'pluralize';
import { useMemo } from 'react';
import { Alert, Badge, Button, Card, CardBody, UncontrolledTooltip } from 'reactstrap';

import { GetColorGuideResult, GuideName } from '@mlp-vectorclub/api-types';
import styles from 'modules/GuideIndexPage.module.scss';
import { DeveloperGuideButtons } from 'src/components/colorguide/DeveloperGuideButtons';
import ButtonCollection from 'src/components/shared/ButtonCollection';
import Content from 'src/components/shared/Content';
import ExternalLink from 'src/components/shared/ExternalLink';
import { GuideIcon } from 'src/components/shared/GuideIcon';
import StandardHeading from 'src/components/shared/StandardHeading';
import { API_DOCS_URL, GUIDE_NAMES } from 'src/config';
import { guideIndexFetcher } from 'src/fetchers';
import InlineIcon from 'src/components/shared/InlineIcon';
import { useAuth, useGuideIndex, useTitleSetter } from 'src/hooks';
import { PATHS } from 'src/paths';
import { useAppDispatch, wrapper } from 'src/store';
import { SSRMessages } from 'src/types';
import { TitleFactory } from 'src/types/title';
import { getGuideLabel, permission } from 'src/utils';
import { titleSetter } from 'src/utils/core';
import { typedServerSideTranslations } from 'src/utils/i18n';

interface PropTypes {
  initialData: GetColorGuideResult;
}

const titleFactory: TitleFactory = () => ({
  title: ['common.titles.colorGuideList'],
  breadcrumbs: [{ label: ['colorGuide.index.breadcrumb'], active: true }],
});

const GuideIndexPage: NextPage<PropTypes> = ({ initialData }) => {
  const t = useTranslations();
  const dispatch = useAppDispatch();
  const data = useGuideIndex(initialData);
  const { signedIn, user } = useAuth();
  const wipMeaning = 'wip-meaning';

  const titleData = useMemo(titleFactory, []);
  useTitleSetter(dispatch, titleData);

  return (
    <Content>
      <StandardHeading heading={t('colorGuide.index.heading')} lead={t('colorGuide.index.lead')} />
      <p className="text-center">
        {t.rich('colorGuide.index.devResources', { api: (chunks) => <ExternalLink href={API_DOCS_URL}>{chunks}</ExternalLink> })}{' '}
        <Badge tag="abbr" color="danger" id={wipMeaning}>
          {t('colorGuide.index.wip')}
        </Badge>
        <UncontrolledTooltip target={wipMeaning} fade={false}>
          {t('colorGuide.index.wipMeaning')}
        </UncontrolledTooltip>
      </p>

      <ButtonCollection>
        <Button tag={Link} href={PATHS.BLENDING} color="guide-link" size="sm">
          <InlineIcon icon="share" first />
          {t('colorGuide.index.buttons.blending')}
        </Button>
        <Button tag={Link} href={PATHS.PICKER} color="guide-link" size="sm">
          <InlineIcon icon="eye-dropper" first />
          {t('colorGuide.index.buttons.picker')}
        </Button>
        <Button tag={Link} href={PATHS.GUIDE_TAGS('pony')} color="guide-link" size="sm">
          <InlineIcon icon="tags" first />
          {t('colorGuide.index.buttons.tags')}
        </Button>
        <Button tag={Link} href={PATHS.GUIDE_SPRITE} color="guide-link" size="sm">
          <InlineIcon icon="image" first />
          {t('colorGuide.index.buttons.sprite')}
        </Button>
        <Button tag={Link} href={PATHS.BLENDING_REVERSE} color="guide-link" size="sm">
          <InlineIcon icon="rotate-left" first />
          {t('colorGuide.index.buttons.blendingReverse')}
        </Button>
        {signedIn && permission(user, 'developer') && <DeveloperGuideButtons />}
      </ButtonCollection>

      {signedIn && user?.id != null && (
        <Alert color="info" className="text-center">
          <InlineIcon icon="info-circle" first />
          {t.rich('colorGuide.index.defaultGuideNotice', {
            settings: (chunks) => <Link href={PATHS.USER_ACCOUNT(user.id)}>{chunks}</Link>,
          })}
        </Alert>
      )}

      <div className={styles.guideList}>
        {GUIDE_NAMES.map((code) => {
          const guideName = getGuideLabel(code);
          const entryCount = data?.entryCounts[code];
          return (
            <Link key={code} href={PATHS.GUIDE(code)} passHref legacyBehavior>
              <Card tag="a">
                <CardBody tag="figure" className={styles.guideFigure}>
                  <div className={styles.guideIcon}>
                    <GuideIcon guide={code} priority />
                  </div>
                  <figcaption>
                    <span className={styles.guideName}>{guideName}</span>
                    <span className={styles.guideCount}>
                      {entryCount} {pluralize('entry', entryCount)}
                    </span>
                  </figcaption>
                </CardBody>
              </Card>
            </Link>
          );
        })}
      </div>
    </Content>
  );
};

export const getServerSideProps = wrapper.getServerSideProps<PropTypes & SSRMessages>((store) => async ({ locale, req }) => {
  let initialData: GetColorGuideResult = {
    entryCounts: GUIDE_NAMES.reduce((acc, c) => ({ ...acc, [c]: 0 }), {} as Record<GuideName, number>),
  };

  try {
    initialData = await guideIndexFetcher(req)();
  } catch (e) {
    /* ignore */
  }

  const props: PropTypes = {
    initialData,
  };
  titleSetter(store, titleFactory());
  return {
    props: {
      ...(await typedServerSideTranslations(locale, ['colorGuide'])),
      ...props,
    },
  };
});

export default GuideIndexPage;
