import { FC } from 'react';
import { Alert } from 'reactstrap';
import InlineIcon from 'src/components/shared/InlineIcon';
import { useDeployWatcher } from 'src/hooks';

const DeployBanner: FC = () => {
  const unreachable = useDeployWatcher();

  if (!unreachable) return null;

  return (
    <div id="deploy-banner">
      <Alert color="warning" fade={false}>
        <InlineIcon icon="sync" spin first />
        We&apos;re deploying an update, reconnecting automatically&hellip;
      </Alert>
    </div>
  );
};

export default DeployBanner;
