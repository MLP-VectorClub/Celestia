import { useAppSelector } from 'src/store';
import { APP_DESCRIPTION, APP_NAME } from 'src/config';
import { FC, useMemo } from 'react';
import { renderingStateSlice } from 'src/utils/store';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { assembleSeoUrl } from 'src/utils';
import { translatableValue } from 'src/hooks';
import { useTranslation } from 'next-i18next/pages';

const TitleManager: FC = () => {
  const { t } = useTranslation();
  const { asPath, defaultLocale, locale, locales } = useRouter();
  const { title } = useAppSelector((store) => renderingStateSlice(store.core));

  const titleText = useMemo(() => `${!title ? '' : `${translatableValue(t, title)} - `}${APP_NAME}`, [t, title]);

  const ogUrl = assembleSeoUrl(asPath);
  const ogImage = assembleSeoUrl('/img/logo.png');

  const languageAlternates = useMemo(
    () =>
      locales?.map((hrefLang) => ({
        hrefLang,
        href: (hrefLang !== defaultLocale ? `/${hrefLang}` : '') + asPath,
      })),
    [asPath, defaultLocale, locales]
  );

  return (
    <Head>
      <title>{titleText}</title>
      <meta name="description" content={APP_DESCRIPTION} />
      <meta property="og:title" content={titleText} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={ogUrl} />
      <meta property="og:locale" content={locale} />
      <meta property="og:site_name" content={APP_NAME} />
      <meta property="og:description" content={APP_DESCRIPTION} />
      <meta property="og:image" content={ogImage} />
      <meta name="twitter:card" content="summary" />
      {languageAlternates?.map(({ hrefLang, href }) => (
        <link key={hrefLang} rel="alternate" hrefLang={hrefLang} href={href} />
      ))}
    </Head>
  );
};

export default TitleManager;
