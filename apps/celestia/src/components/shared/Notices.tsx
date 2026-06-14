import { Alert } from 'reactstrap';
import InlineIcon from 'src/components/shared/InlineIcon';
import ExternalLink from 'src/components/shared/ExternalLink';
import { OLD_SITE_HOST } from 'src/config';
import { useRouter } from 'next/router';
import { FC, ReactNode } from 'react';
import { useTranslations } from 'next-intl';

const Notices: FC = () => {
  const t = useTranslations();
  const router = useRouter();
  const url = OLD_SITE_HOST + router.asPath;
  return (
    <div id="notices">
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
