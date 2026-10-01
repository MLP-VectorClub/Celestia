import { FC, useEffect, useRef, useState } from 'react';
import { FormGroup, FormText, Input, Label } from 'reactstrap';

import { FormDialog } from 'src/components/shared/dialogs/FormDialog';
import { describeApiError, fieldErrors, useApiMutation } from 'src/hooks';
import { AppearanceEditService } from 'src/services/appearance-edit';
import { ENDPOINTS } from 'src/utils';

interface PropTypes {
  appearanceId: number;
  isOpen: boolean;
  onClose: () => void;
}

/** Tags are edited as one comma separated text, `origTags` lets the API notice somebody else changed them meanwhile */
export const AppearanceTagsDialog: FC<PropTypes> = ({ appearanceId, isOpen, onClose }) => {
  const [tags, setTags] = useState('');
  const original = useRef('');
  const [loaded, setLoaded] = useState(false);

  const load = useApiMutation(() => AppearanceEditService.getTags(appearanceId), {
    onSuccess: (data) => {
      original.current = data.tags ?? '';
      setTags(original.current);
      setLoaded(true);
    },
  });
  useEffect(() => {
    if (isOpen && !loaded && !load.isPending) load.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, loaded]);

  const save = useApiMutation(() => AppearanceEditService.setTags(appearanceId, tags, original.current), {
    invalidate: [[ENDPOINTS.APPEARANCE({ id: appearanceId })]],
    onSuccess: () => {
      setLoaded(false);
      onClose();
    },
  });

  const errors = fieldErrors(save.error);
  const error = save.error ?? load.error;

  return (
    <FormDialog
      title="Edit tags"
      isOpen={isOpen}
      onClose={() => {
        save.reset();
        setLoaded(false);
        onClose();
      }}
      onSubmit={() => save.mutate()}
      submitLabel="Save tags"
      busy={save.isPending || load.isPending}
      error={error && !errors.tags ? describeApiError(error) : null}
    >
      <FormGroup>
        <Label for={`tags-${appearanceId}`}>Tags</Label>
        <Input
          id={`tags-${appearanceId}`}
          type="textarea"
          rows={4}
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          invalid={Boolean(errors.tags)}
        />
        {errors.tags && <div className="invalid-feedback d-block">{errors.tags}</div>}
        <FormText>Separate tags with commas. Prefix a tag with its type (for example “spec:unicorn”) to create it with that type.</FormText>
      </FormGroup>
    </FormDialog>
  );
};
