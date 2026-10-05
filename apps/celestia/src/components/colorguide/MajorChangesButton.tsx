import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { FC } from 'react';
import { Button } from 'reactstrap';

import { GuideName } from '@mlp-vectorclub/api-types';
import InlineIcon from 'src/components/shared/InlineIcon';
import { PATHS } from 'src/paths';

const MajorChangesButton: FC<{ guide: GuideName }> = ({ guide }) => {
  const t = useTranslations();
  return (
    <Link href={PATHS.GUIDE_CHANGES(guide)} passHref legacyBehavior>
      <Button color="guide-link" size="sm">
        <InlineIcon icon="exclamation-triangle" first />
        {t('colorGuide.nav.majorChanges')}
      </Button>
    </Link>
  );
};

export default MajorChangesButton;
