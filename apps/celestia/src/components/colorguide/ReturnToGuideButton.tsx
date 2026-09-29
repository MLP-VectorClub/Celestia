import Link from 'next/link';
import { FC } from 'react';
import { Button } from 'reactstrap';

import { GuideName } from '@mlp-vectorclub/api-types';
import InlineIcon from 'src/components/shared/InlineIcon';
import { PATHS } from 'src/paths';

const ReturnToGuideButton: FC<{ guide: GuideName }> = ({ guide }) => (
  <Link href={PATHS.GUIDE(guide)} passHref legacyBehavior>
    <Button color="link" size="sm">
      <InlineIcon icon="arrow-circle-left" first />
      Return to Guide
    </Button>
  </Link>
);

export default ReturnToGuideButton;
