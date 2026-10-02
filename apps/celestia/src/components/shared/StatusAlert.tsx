import { useTranslations } from 'next-intl';
import { FC, ReactNode } from 'react';
import { Alert } from 'reactstrap';

import InlineIcon from 'src/components/shared/InlineIcon';
import { Status } from 'src/types';

interface PropTypes {
  status: Status;
  subject?: string;
  errorMessage?: ReactNode;
  loadingMessage?: ReactNode;
}

const StatusAlert: FC<PropTypes> = ({ status, loadingMessage, errorMessage, subject }) => {
  const t = useTranslations();
  const what = subject ?? t('common.status.dataSubject');
  if (status === Status.FAILURE) {
    const message = errorMessage || t('common.status.failed', { subject: what });
    return (
      <Alert color="danger" fade={false} className="text-center">
        {message}
      </Alert>
    );
  }

  if (status === Status.LOAD) {
    const message = loadingMessage || t('common.status.loading', { subject: what });
    return (
      <Alert color="ui" fade={false} className="text-center">
        <InlineIcon loading first />
        {message}
      </Alert>
    );
  }

  return null;
};

export default StatusAlert;
