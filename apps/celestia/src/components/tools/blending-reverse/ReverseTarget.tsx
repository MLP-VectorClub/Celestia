import { useTranslations } from 'next-intl';
import { FC, useRef } from 'react';
import { Button, FormGroup, Input, Label } from 'reactstrap';

import { ColorField } from 'src/components/tools/shared/ColorField';

export type TargetType = 'image' | 'color';

interface PropTypes {
  type: TargetType;
  onTypeChange: (type: TargetType) => void;
  color: string;
  onColorChange: (color: string) => void;
  fileName: string | null;
  /** Reports an error message when the chosen file is not a readable image */
  onFile: (file: File) => void;
  error: string | null;
}

/** Choose whether to reverse the filter on an uploaded image or on a single color, and provide it */
export const ReverseTarget: FC<PropTypes> = ({ type, onTypeChange, color, onColorChange, fileName, onFile, error }) => {
  const t = useTranslations();
  const fileInput = useRef<HTMLInputElement>(null);

  return (
    <>
      <div className="d-flex gap-3 mb-2">
        {(['image', 'color'] as const).map((value) => (
          <FormGroup check key={value} className="mb-0">
            <Input
              id={`target-${value}`}
              type="radio"
              name="reverse-target"
              checked={type === value}
              onChange={() => onTypeChange(value)}
            />
            <Label for={`target-${value}`} check>
              {t(`tools.reverse.${value}`)}
            </Label>
          </FormGroup>
        ))}
      </div>
      {type === 'color' ? (
        <ColorField id="target-color" label={t('tools.reverse.filteredColor')} value={color} onChange={onColorChange} />
      ) : (
        <div>
          <Button color="primary" size="sm" onClick={() => fileInput.current?.click()}>
            {t('tools.reverse.browse')}
          </Button>
          {fileName && <span className="ms-2">{fileName}</span>}
          <input
            ref={fileInput}
            type="file"
            hidden
            aria-label={t('tools.reverse.filteredImage')}
            accept=".png,.jpg,.jpeg,.bmp,image/png,image/jpeg,image/bmp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFile(file);
              if (fileInput.current) fileInput.current.value = '';
            }}
          />
          {error && <div className="text-danger small mt-1">{error}</div>}
        </div>
      )}
    </>
  );
};
