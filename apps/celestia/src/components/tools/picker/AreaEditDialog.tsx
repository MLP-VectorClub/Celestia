import { FC, useEffect, useState } from 'react';
import { FormGroup, Input, Label } from 'reactstrap';

import { FormDialog } from 'src/components/shared/dialogs/FormDialog';
import { AreaShape, MAX_AREA_SIZE, MIN_AREA_SIZE, PickingArea, clampAreaSize } from 'src/utils/picker/areas';

interface PropTypes {
  /** The area being edited, the dialog is closed while this is `null` */
  area: PickingArea | null;
  onClose: () => void;
  onSubmit: (change: { shape: AreaShape; size: number }) => void;
}

/** Change the shape and size of a placed picking area, it keeps its center */
export const AreaEditDialog: FC<PropTypes> = ({ area, onClose, onSubmit }) => {
  const [shape, setShape] = useState<AreaShape>('square');
  const [size, setSize] = useState('');
  useEffect(() => {
    if (area) {
      setShape(area.shape);
      setSize(String(area.size));
    }
  }, [area]);

  const parsed = Number(size);
  const valid = size.trim() !== '' && Number.isFinite(parsed);

  return (
    <FormDialog
      title="Edit picking area"
      isOpen={area !== null}
      onClose={onClose}
      onSubmit={() => {
        if (!valid) return;
        onSubmit({ shape, size: clampAreaSize(parsed) });
        onClose();
      }}
      submitLabel="Apply"
    >
      <FormGroup>
        <Label for="area-shape">Shape</Label>
        <Input id="area-shape" type="select" value={shape} onChange={(e) => setShape(e.target.value as AreaShape)}>
          <option value="square">Square</option>
          <option value="round">Round</option>
        </Input>
      </FormGroup>
      <FormGroup>
        <Label for="area-size">
          Size ({MIN_AREA_SIZE}–{MAX_AREA_SIZE} px)
        </Label>
        <Input
          id="area-size"
          type="number"
          min={MIN_AREA_SIZE}
          max={MAX_AREA_SIZE}
          step={1}
          value={size}
          onChange={(e) => setSize(e.target.value)}
          invalid={!valid}
        />
      </FormGroup>
    </FormDialog>
  );
};
