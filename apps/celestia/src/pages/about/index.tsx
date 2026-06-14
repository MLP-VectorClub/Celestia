import { FC, FunctionComponent, PropsWithChildren, ReactNode, useMemo } from 'react';
import Link from 'next/link';
import {
  BACKEND_GITHUB_URL,
  BACKEND_PROJECT_NAME,
  DEVIANTART_GROUP_NAME,
  DEVIANTART_GROUP_URL,
  GITHUB_URL,
  PROJECT_NAME,
} from 'src/config';
import { useAppDispatch, wrapper } from 'src/store';
import { getGuideLabel } from 'src/utils';
import Content from 'src/components/shared/Content';
import ExternalLink from 'src/components/shared/ExternalLink';
import DeviantLink from 'src/components/shared/DeviantLink';
import FavMe, { FavMeProps } from 'src/components/shared/FavMe';
import StandardHeading from 'src/components/shared/StandardHeading';
import Image from 'next/image';
import InlineIcon from 'src/components/shared/InlineIcon';
import { useTitleSetter } from 'src/hooks';
import { TitleFactory } from 'src/types/title';
import { titleSetter } from 'src/utils/core';
import { NextPage } from 'next';
import { PATHS } from 'src/paths';
import { Translatable } from 'src/types';
import { useTranslations } from 'next-intl';
import { typedServerSideTranslations } from 'src/utils/i18n';

const AppPageLink: FC<PropsWithChildren<{ href: string }>> = ({ children, href }) => (
  <Link href={href}>
    {children}
  </Link>
);

const ChildfreeFavme: FunctionComponent<FavMeProps & { content: ReactNode }> = ({ content, ...props }) => (
  <FavMe {...props}>{content}</FavMe>
);

const titleFactory: TitleFactory = () => {
  const title: Translatable = ['common.titles.about'];
  return {
    title,
    breadcrumbs: [{ label: title, active: true }],
  };
};

// TODO Eliminate all remaining hard-coded copy text

const AboutPage: NextPage = () => {
  const t = useTranslations();
  const dispatch = useAppDispatch();
  const titleData = useMemo(titleFactory, []);
  useTitleSetter(dispatch, titleData);

  const heading = t.rich('about.website', {
    linkText: DEVIANTART_GROUP_NAME,
    link: (chunks: ReactNode) => <ExternalLink href={DEVIANTART_GROUP_URL}>{chunks}</ExternalLink>,
  });

  return (
    <Content>
      <div className="d-flex justify-content-center">
        <Image src="/img/logo.svg" alt="MLP Vector Club Website Logo" id="about-logo" width={200} height={200} priority unoptimized />
      </div>
      <StandardHeading heading={heading} lead={t('about.tagline')} />
      <section className="what-s-this-site-">
        <h2 id="what-s-this-site-">{t('about.whatsThisSite.title')}</h2>
        <p>{t('about.whatsThisSite.p1')}</p>
        <p>{t('about.whatsThisSite.p2')}</p>
      </section>
      <section className="attributions">
        <h2>{t('about.attributions.title')}</h2>
        <p>
          {t.rich('about.attributions.github', {
            link: (chunks: ReactNode) => <a href={`${GITHUB_URL}#attributions`}>{chunks}</a>,
          })}
        </p>
        <p>
          {t.rich('about.attributions.blendingCalc', {
            calc: (chunks: ReactNode) => <AppPageLink href={PATHS.BLENDING}>{chunks}</AppPageLink>,
            author: (chunks: ReactNode) => <ExternalLink href="https://github.com/dasprid">{chunks}</ExternalLink>,
          })}
          <br />

          {t.rich('about.attributions.headingFont', {
            linkText: 'Celestia Medium Redux',
            bold: (chunks: ReactNode) => <strong>{chunks}</strong>,
            link: (chunks: ReactNode) => <ExternalLink href="http://www.mattyhex.net/CMR/">{chunks}</ExternalLink>,
          })}
          <br />

          {t.rich('about.attributions.daLogo', {
            copyright: 'DeviantArt',
            bold: (chunks: ReactNode) => <strong>{chunks}</strong>,
            link: (chunks: ReactNode) => <ExternalLink href="https://www.deviantart.com/">{chunks}</ExternalLink>,
          })}
          <br />

          {t.rich('about.attributions.aiLogo', {
            copyright: 'Adobe Systems Inc.',
            link: (chunks: ReactNode) => (
              <ExternalLink href="https://commons.wikimedia.org/wiki/File:Adobe_Illustrator_CC_icon.svg">{chunks}</ExternalLink>
            ),
          })}
          <br />

          {t.rich('about.attributions.inkscapeLogo', {
            link: (chunks: ReactNode) => <ExternalLink href="https://commons.wikimedia.org/wiki/File:Inkscape_Logo.svg">{chunks}</ExternalLink>,
          })}
          <br />

          {t.rich('about.attributions.ponyscapeLogo', {
            link: (chunks: ReactNode) => (
              <ExternalLink href="https://www.deviantart.com/flutterguy317/art/Ponyscape-PNG-354658716">{chunks}</ExternalLink>
            ),
            author: () => <DeviantLink username="flutterguy317" />,
          })}
          <br />

          {t.rich('about.attributions.applicationLogo', {
            bold: (chunks: ReactNode) => <strong>{chunks}</strong>,
            christmasLink: (chunks: ReactNode) => (
              <a href="https://www.deviantart.com/pirill-poveniy/art/Collab-Christmas-Vector-of-the-MLP-VC-Mascot-503196118">
                {chunks}
              </a>
            ),
            author1: () => <DeviantLink username="Pirill-Poveniy" />,
            author2: () => <DeviantLink username="thediscorded" />,
            author3: () => <DeviantLink username="masemj" />,
            author4: () => <DeviantLink username="Ambassad0r" />,
            pennyLink: (chunks: ReactNode) => (
              <a href="https://www.deviantart.com/ambassad0r/art/Penny-Curve-MLP-VectorClub-Mascot-2-0-568079382">{chunks}</a>
            ),
            author5: () => <DeviantLink username="Ambassad0r" />,
          })}
          <br />

          {t.rich('about.attributions.logoVectors.general', {
            copyright: 'Hasbro Studios, LLC.',
            bold: (chunks: ReactNode) => <strong>{chunks}</strong>,
          })}
          <ul>
            <li>
              {t.rich('about.attributions.logoVectors.specific', {
                favme: () => <ChildfreeFavme id="db60g3n" content={getGuideLabel('pony')} />,
                author: () => <DeviantLink username="drakizora" />,
              })}
            </li>
            <li>
              {t.rich('about.attributions.logoVectors.specific', {
                favme: () => <ChildfreeFavme id="d6923sw" content={getGuideLabel('eqg')} />,
                author: () => <DeviantLink username="Charleston-and-itchy" />,
              })}
            </li>
            <li>
              {t.rich('about.attributions.logoVectors.specific', {
                favme: () => <ChildfreeFavme id="ddztpnc" content={getGuideLabel('pl')} />,
                author: () => <DeviantLink username="illumnious" />,
              })}
            </li>
          </ul>

          {t.rich('about.attributions.uiIcons', {
            linkText: 'FontAwesome Free',
            bold: (chunks: ReactNode) => <strong>{chunks}</strong>,
            link: (chunks: ReactNode) => <a href="https://fontawesome.com/license">{chunks}</a>,
          })}
          <br />

          {t.rich('about.attributions.browserLogos.general', {
            bold: (chunks: ReactNode) => <strong>{chunks}</strong>,
            link: (chunks: ReactNode) => <AppPageLink href={PATHS.ABOUT_CONNECTION}>{chunks}</AppPageLink>,
          })}
          <br />
        </p>
        <ul>
          <li>
            <FavMe id="d9rtlbv">Edge</FavMe>
            {' by '}
            <DeviantLink username="masemj" />
            {' ('}
            <FavMe id="d8uhefy">designed</FavMe>
            {' by '}
            <DeviantLink username="furrgroup" />)
          </li>
          <li>
            <FavMe id="d4b6f4v">Firefox</FavMe>
            {' by '}
            <DeviantLink username="NoReasonToHope" />
          </li>
          <li>
            <FavMe id="d523s3y">Google Chrome</FavMe>
            {' by '}
            <DeviantLink username="he4rtofcourage" />
          </li>
          <li>
            <FavMe id="d52fp08">Internet Explorer</FavMe>
            {' by '}
            <DeviantLink username="McSadat" />
          </li>
          <li>
            <FavMe id="dacngnh">Opera</FavMe>
            {' by '}
            <DeviantLink username="masemj" />
            {' ('}
            <FavMe id="d52qnaw">designed</FavMe>
            {' by '}
            <DeviantLink username="ParallaxMLP" />)
          </li>
          <li>
            <FavMe id="dadu3l9">Safari</FavMe>
            {' by '}
            <DeviantLink username="masemj" />
            {' ('}
            <FavMe id="d530knp">designed</FavMe>
            {' by '}
            <DeviantLink username="ParallaxMLP" />)
          </li>
          <li>
            Vivaldi from <ExternalLink href="https://vivaldi.com/press/">Vivaldi Press Kit</ExternalLink>
          </li>
          <li>
            Other logos not mentioned previously were found on{' '}
            <ExternalLink href="https://github.com/alrra/browser-logos/">alrra/browser-logos</ExternalLink>
          </li>
        </ul>
        <p>
          <strong>Episode synopsis data</strong>
          {' is provided by '}
          <ExternalLink href="https://www.themoviedb.org/documentation/api">The Movie Database API</ExternalLink>
          {`. ${t('common.tmdbDisclaimer')}`}
          <br />
          <strong>Coding, design & hosting:</strong> <ExternalLink href="https://went.tf">WentTheFox</ExternalLink>
        </p>
      </section>
      <section id="supported-providers">
        <h2>{t('about.providers.title')}</h2>
        <div>
          <p>{t('about.providers.p1')}</p>
          <ul>
            <li>
              <a href="https://sta.sh/">Sta.sh</a>*
            </li>
            <li>
              <a href="https://deviantart.com/">DeviantArt</a>*
            </li>
            <li>
              <a href="https://imgur.com/">Imgur</a>
            </li>
            <li>
              <a href="https://derpibooru.org/">Derpibooru</a>
            </li>
            <li>
              <a href="https://app.prntscr.com/">LightShot</a>
            </li>
          </ul>
          <p>{t('about.providers.asterisk')}</p>
        </div>
      </section>
      <section>
        <h2>{t('about.openSource.title')}</h2>
        <div>
          <p>{t('about.openSource.p1')}</p>
          <ul>
            <li>
              Frontend: <ExternalLink href={GITHUB_URL}>{PROJECT_NAME}</ExternalLink>
            </li>
            <li>
              Backend: <ExternalLink href={BACKEND_GITHUB_URL}>{BACKEND_PROJECT_NAME}</ExternalLink>
            </li>
          </ul>
          <p>
            {t.rich('about.openSource.p2', {
              icon: () => <InlineIcon icon="chevron-right" fixedWidth />,
            })}
          </p>
        </div>
      </section>
    </Content>
  );
};

export const getStaticProps = wrapper.getStaticProps((store) => async ({ locale }) => {
  titleSetter(store, titleFactory());
  return {
    props: {
      ...(await typedServerSideTranslations(locale, ['about'])),
    },
  };
});

export default AboutPage;
