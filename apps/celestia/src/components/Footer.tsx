import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { FC } from 'react';

import ContactModal from 'src/components/ContactModal';
import Abbr from 'src/components/shared/Abbr';
import ContactLink from 'src/components/shared/ContactLink';
import ExternalLink from 'src/components/shared/ExternalLink';
import FooterVersionInfo from 'src/components/shared/FooterVersionInfo';
import { API_DOCS_URL } from 'src/config';
import { PATHS } from 'src/paths';

const Footer: FC = () => {
  const t = useTranslations();
  return (
    <>
      <footer id="footer" role="contentinfo">
        <FooterVersionInfo />
        {` | `}
        <Link href={PATHS.PRIVACY_POLICY}>{t('common.footer.privacyPolicy')}</Link>
        {` | `}
        <ContactLink>{t('common.footer.contactUs')}</ContactLink>
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
