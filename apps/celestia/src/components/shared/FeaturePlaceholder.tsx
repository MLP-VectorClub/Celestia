import { FC, PropsWithChildren } from 'react';
import { Alert } from 'reactstrap';

import InlineIcon from 'src/components/shared/InlineIcon';

export const FeaturePlaceholder: FC<PropsWithChildren> = ({ children = 'This feature is not available yet' }) => (
  <Alert color="ui" fade={false}>
    <InlineIcon icon="hard-hat" first />
    {children}
  </Alert>
);
