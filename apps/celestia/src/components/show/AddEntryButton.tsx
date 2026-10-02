import { useRouter } from 'next/router';
import { FC, useState } from 'react';
import { Button } from 'reactstrap';

import InlineIcon from 'src/components/shared/InlineIcon';
import { ShowFormDialog } from 'src/components/show/ShowFormDialog';

export const AddEntryButton: FC<{ noun: string; category: 'episode' | 'other' }> = ({ noun, category }) => {
  const { push } = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button color="success" size="sm" onClick={() => setOpen(true)}>
        <InlineIcon icon="plus" first />
        Add new {noun}
      </Button>
      <ShowFormDialog category={category} isOpen={open} onClose={() => setOpen(false)} onSaved={(path) => void push(path)} />
    </>
  );
};
