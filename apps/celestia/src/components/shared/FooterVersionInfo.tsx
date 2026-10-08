import { useTranslations } from 'next-intl';
import { FC, MouseEventHandler, useCallback, useState } from 'react';
import { UncontrolledTooltip } from 'reactstrap';

import FooterGitInfo from 'src/components/shared/FooterGitInfo';
import FooterLastUpdateInfo from 'src/components/shared/FooterLastUpdateInfo';
import InlineIcon from 'src/components/shared/InlineIcon';
import { useConnectionInfo } from 'src/hooks';

const FooterVersionInfo: FC = () => {
  const t = useTranslations();
  const connectionInfo = useConnectionInfo();

  const [gitInfoOpen, setGitInfoOpen] = useState(false);
  const toggleGitInfo: MouseEventHandler = useCallback(
    (e) => {
      e.preventDefault();
      setGitInfoOpen(!gitInfoOpen);
    },
    [gitInfoOpen]
  );

  return (
    <>
      <button
        type="button"
        id="git-info-toggle"
        className="me-2"
        aria-label={gitInfoOpen ? t('common.footer.hideGitInfo') : t('common.footer.showGitInfo')}
        onClick={toggleGitInfo}
      >
        <InlineIcon icon={gitInfoOpen ? 'chevron-left' : 'chevron-right'} fixedWidth />
      </button>
      <UncontrolledTooltip target="git-info-toggle" placement="top" fade={false} offset={[0, 14]}>
        {gitInfoOpen ? t('common.footer.hideGitInfo') : t('common.footer.showGitInfo')}
      </UncontrolledTooltip>
      {gitInfoOpen ? <FooterGitInfo {...connectionInfo} /> : <FooterLastUpdateInfo {...connectionInfo} />}
    </>
  );
};

export default FooterVersionInfo;
