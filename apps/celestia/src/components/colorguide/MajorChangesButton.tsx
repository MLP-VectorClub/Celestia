import Link from 'next/link';
import { FC } from 'react';
import { Button } from 'reactstrap';

import { GuideName } from '@mlp-vectorclub/api-types';
import InlineIcon from 'src/components/shared/InlineIcon';
import { PATHS } from 'src/paths';

const MajorChangesButton: FC<{ guide: GuideName }> = ({ guide }) => (
  <Link href={PATHS.GUIDE_CHANGES(guide)} passHref legacyBehavior>
    <Button color="link" size="sm">
      <InlineIcon icon="exclamation-triangle" first />
      Major Changes
    </Button>
  </Link>
);

export default MajorChangesButton;
