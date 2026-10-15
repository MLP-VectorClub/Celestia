import { useTranslations } from 'next-intl';
import { useRouter } from 'next/router';
import { FC } from 'react';
import { Alert } from 'reactstrap';

import { useConfig, useCurrentNotices } from 'src/hooks';
import { renderNoticeHtml, substituteNoticePath } from 'src/utils/notice-html';

const NOTICE_COLORS = { info: 'info', success: 'success', fail: 'danger', warn: 'warning', caution: 'warning' } as const;

const Notices: FC = () => {
  const router = useRouter();
  const t = useTranslations();
  const notices = useCurrentNotices();
  const { config } = useConfig();
  // Statically generated pages (like 404) were rendered with their route as the path, so only use
  // the real path once the router is ready after hydration, or the links won't match the server HTML
  // The server never sees the `#fragment` of the address, leave it out or the HTML differs
  const path = router.isReady ? router.asPath.replace(/#.*$/, '') : router.pathname;
  return (
    <div id="notices">
      {config?.readOnly && (
        <Alert id="read-only-notice" color="warning" fade={false}>
          {t('common.readOnlyNotice')}
        </Alert>
      )}
      {notices?.map((notice) => (
        <Alert key={notice.id} color={NOTICE_COLORS[notice.type]} fade={false}>
          {renderNoticeHtml(substituteNoticePath(notice.messageHtml, path))}
        </Alert>
      ))}
    </div>
  );
};

export default Notices;
