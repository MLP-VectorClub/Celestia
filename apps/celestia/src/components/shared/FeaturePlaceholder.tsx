import { useTranslations } from 'next-intl';
import { FC, PropsWithChildren } from 'react';
import { Alert } from 'reactstrap';

import InlineIcon from 'src/components/shared/InlineIcon';

export const FeaturePlaceholder: FC<PropsWithChildren> = ({ children }) => {
  const t = useTranslations();
  return (
    <Alert color="ui" fade={false}>
      <InlineIcon icon="hard-hat" first />
      {children ?? t('common.featureUnavailable')}
    </Alert>
  );
};
