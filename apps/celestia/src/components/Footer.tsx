import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FC } from 'react';

import ContactModal from 'src/components/ContactModal';
import Abbr from 'src/components/shared/Abbr';
import ContactLink from 'src/components/shared/ContactLink';
import ExternalLink from 'src/components/shared/ExternalLink';
import FooterVersionInfo from 'src/components/shared/FooterVersionInfo';
import { API_DOCS_URL } from 'src/config';
import { PATHS } from 'src/paths';
import { oldSiteUrl } from 'src/utils/old-site';

const Footer: FC = () => {
  const t = useTranslations();
  const router = useRouter();
  // Like the notices: statically generated pages were rendered with their route, so the real path is only used once the router is ready (no #fragment either)
  const path = router.isReady ? router.asPath.replace(/#.*$/, '') : router.pathname;
  return (
    <>
      <footer id="footer" role="contentinfo">
        <FooterVersionInfo />
        {` | `}
        <Link href={PATHS.PRIVACY_POLICY}>{t('common.footer.privacyPolicy')}</Link>
        {` | `}
        <ContactLink>{t('common.footer.contactUs')}</ContactLink>
        {` | `}
        <ExternalLink href={oldSiteUrl(path)} title={t('common.footer.oldSiteTitle')}>{t('common.footer.oldSite')}</ExternalLink>
        {` | `}
        <ExternalLink href="https://status.mlpvector.club">{t('common.footer.status')}</ExternalLink>
        {` | `}
        <Abbr id="api-docs" title={t('common.footer.apiMeaning')}>
          <ExternalLink id="api-docs" href={API_DOCS_URL}>
            {t('common.footer.api')}
          </ExternalLink>
        </Abbr>
      </footer>
      <ContactModal />
    </>
  );
};

export default Footer;
