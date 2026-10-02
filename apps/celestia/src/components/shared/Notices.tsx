import { useTranslations } from 'next-intl';
import { useRouter } from 'next/router';
import { FC, ReactNode } from 'react';
import { Alert } from 'reactstrap';

import ExternalLink from 'src/components/shared/ExternalLink';
import InlineIcon from 'src/components/shared/InlineIcon';
import { OLD_SITE_HOST } from 'src/config';
import { useCurrentNotices } from 'src/hooks';
import { renderNoticeHtml } from 'src/utils/notice-html';

const NOTICE_COLORS = { info: 'info', success: 'success', fail: 'danger', warn: 'warning', caution: 'warning' } as const;

const Notices: FC = () => {
  const t = useTranslations();
  const router = useRouter();
  const notices = useCurrentNotices();
  // Statically generated pages (like 404) were rendered with their route as the path, so only use
  // the real path once the router is ready after hydration, or the link won't match the server HTML
  const url = OLD_SITE_HOST + (router.isReady ? router.asPath : router.pathname);
  return (
    <div id="notices">
      {notices?.map((notice) => (
        <Alert key={notice.id} color={NOTICE_COLORS[notice.type]} fade={false}>
          {renderNoticeHtml(notice.messageHtml)}
        </Alert>
      ))}
      <Alert color="warning" fade={false}>
        <InlineIcon icon="hard-hat" first />
        {t.rich('common.wipNotice', {
          url,
          link: (chunks: ReactNode) => (
            <ExternalLink href={url} blank={false} className="alert-link">
              {chunks}
            </ExternalLink>
          ),
        })}
      </Alert>
    </div>
  );
};

export default Notices;
