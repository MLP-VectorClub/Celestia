import { FC } from 'react';
import { Alert, Button } from 'reactstrap';

import InlineIcon from 'src/components/shared/InlineIcon';
import { useDeployWatcher } from 'src/hooks';

const DeployBanner: FC = () => {
  const { unreachable, ready, reload } = useDeployWatcher();

  if (!unreachable) return null;

  return (
    <div id="deploy-banner">
      <Alert color="warning" fade={false}>
        {ready ? (
          <>
            <InlineIcon icon="sync" first />
            An update has been deployed. Reload the page to continue; anything you have not saved yet will be lost.
          </>
        ) : (
          <>
            <InlineIcon icon="sync" spin first />
            We&apos;re deploying an update, this will only take a moment&hellip;
          </>
        )}{' '}
        <Button color="ui" size="sm" onClick={reload}>
          Reload
        </Button>
      </Alert>
    </div>
  );
};

export default DeployBanner;
