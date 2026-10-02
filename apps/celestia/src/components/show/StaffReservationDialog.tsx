import { FC, useState } from 'react';
import { FormGroup, FormText, Input, Label } from 'reactstrap';

import { FormDialog } from 'src/components/shared/dialogs/FormDialog';
import { describeApiError, fieldErrors, useApiMutation } from 'src/hooks';
import { PostService } from 'src/services/posts';
import { ENDPOINTS } from 'src/utils';

interface PropTypes {
  showId: number;
  isOpen: boolean;
  onClose: () => void;
}

/** Staff add a finished reservation for a member from the link of the finished deviation */
export const StaffReservationDialog: FC<PropTypes> = ({ showId, isOpen, onClose }) => {
  const [deviation, setDeviation] = useState('');
  const save = useApiMutation(() => PostService.addReservation(showId, deviation.trim()), {
    invalidate: [[ENDPOINTS.POSTS({ showId, kind: 'reservation' })]],
    onSuccess: () => {
      setDeviation('');
      onClose();
    },
  });
  const errors = fieldErrors(save.error);

  return (
    <FormDialog
      title="Add a finished reservation"
      isOpen={isOpen}
      onClose={() => {
        save.reset();
        onClose();
      }}
      onSubmit={() => deviation.trim() && save.mutate()}
      submitLabel="Add reservation"
      busy={save.isPending}
      error={save.error && !errors.deviation ? describeApiError(save.error) : null}
    >
      <FormGroup>
        <Label for="staff-reservation-deviation">Link to the finished deviation</Label>
        <Input
          id="staff-reservation-deviation"
          type="url"
          placeholder="https://www.deviantart.com/…"
          value={deviation}
          onChange={(e) => setDeviation(e.target.value)}
          invalid={Boolean(errors.deviation)}
          autoFocus
          required
        />
        {errors.deviation && <div className="invalid-feedback d-block">{errors.deviation}</div>}
        <FormText>The reservation is credited to the deviation&apos;s author.</FormText>
      </FormGroup>
    </FormDialog>
  );
};
