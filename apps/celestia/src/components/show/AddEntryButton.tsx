import { FC } from 'react';
import { Button } from 'reactstrap';

import InlineIcon from 'src/components/shared/InlineIcon';

export const AddEntryButton: FC<{ noun: string }> = ({ noun }) => (
  <Button color="success" size="sm" disabled>
    <InlineIcon icon="plus" first />
    Add new {noun}
  </Button>
);
