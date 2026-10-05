import { useTranslations } from 'next-intl';
import { FC } from 'react';
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';

import { hexToRgb } from 'src/utils';

interface PropTypes {
  hex: string;
  /** Where the color is, e.g. appearance › color group › color */
  path: string[];
  onClose: () => void;
}

/** "RGB values for color #…": what Shift+clicking a color square (or the sidebar's "show RGB values" switch) opens */
export const RgbValuesDialog: FC<PropTypes> = ({ hex, path, onClose }) => {
  const t = useTranslations();
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  return (
    <Modal className="modal-ui" centered isOpen toggle={onClose}>
      <ModalHeader toggle={onClose}>{t('colorGuide.colorCopy.rgbTitle', { hex })}</ModalHeader>
      <ModalBody className="text-center">
        {path.length > 0 && <div>{path.join(' › ')}</div>}
        <div className="mt-1" style={{ fontSize: '1.2em' }}>
          rgb(<code className="text-danger">{rgb.red}</code>, <code className="text-success">{rgb.green}</code>,{' '}
          <code className="text-primary">{rgb.blue}</code>)
        </div>
      </ModalBody>
      <ModalFooter>
        <Button color="link" onClick={onClose}>
          {t('colorGuide.colorCopy.close')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};
