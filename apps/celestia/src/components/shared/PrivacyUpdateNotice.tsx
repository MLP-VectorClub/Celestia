import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { FC, ReactNode, useEffect, useState } from 'react';
import { Alert } from 'reactstrap';

import { PATHS } from 'src/paths';
import { dismissPrivacyNotice, readPrivacyNoticeDismissal, shouldShowPrivacyNotice } from 'src/utils/privacy-notice';

/** Anchor of the visitor statistics section (and the opt-out) on the privacy policy page */
export const STATISTICS_ANCHOR = 'visitor-statistics';

/**
 * Tells visitors about the anonymous visitor statistics and where to opt out, until they dismiss it (see `utils/privacy-notice.ts`). The dismissal is
 * only in the browser, so nothing is shown for the server's HTML and the first render: it would flash or not match
 */
const PrivacyUpdateNotice: FC = () => {
  const t = useTranslations('common.privacyNotice');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(shouldShowPrivacyNotice(readPrivacyNoticeDismissal()));
  }, []);

  if (!visible) return null;

  return (
    <Alert
      id="privacy-update-notice"
      color="info"
      fade={false}
      toggle={() => {
        dismissPrivacyNotice();
        setVisible(false);
      }}
      closeClassName="btn-close"
    >
      <strong>{t('title')}</strong>{' '}
      {t.rich('body', {
        link: (chunks: ReactNode) => <Link href={`${PATHS.PRIVACY_POLICY}#${STATISTICS_ANCHOR}`}>{chunks}</Link>,
      })}
    </Alert>
  );
};

export default PrivacyUpdateNotice;
