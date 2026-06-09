import { Status } from 'src/types';
import { Alert } from 'reactstrap';
import InlineIcon from 'src/components/shared/InlineIcon';
import { FC, ReactNode } from 'react';

interface PropTypes {
  status: Status;
  subject?: string;
  errorMessage?: ReactNode;
  loadingMessage?: ReactNode;
}

const StatusAlert: FC<PropTypes> = ({ status, loadingMessage, errorMessage, subject = 'data' }) => {
  if (status === Status.FAILURE) {
    const message = errorMessage || `Failed to fetch ${subject}, please try again later.`;
    return (
      <Alert color="danger" fade={false} className="text-center">
        {message}
      </Alert>
    );
  }

  if (status === Status.LOAD) {
    const message = loadingMessage || `Loading ${subject}, please wait…`;
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
