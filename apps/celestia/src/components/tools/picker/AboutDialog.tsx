import { useTranslations } from 'next-intl';
import { FC } from 'react';
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';

/** What the picker is for and how to find its controls */
export const AboutDialog: FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const t = useTranslations();
  return (
    <Modal className="modal-ui" centered isOpen={isOpen} toggle={onClose}>
      <ModalHeader toggle={onClose}>{t('picker.about.title')}</ModalHeader>
      <ModalBody>
        <p>{t('picker.about.p1')}</p>
        <p>{t('picker.about.p2')}</p>
        <p>{t('picker.about.p3')}</p>
        <p className="mb-0">{t('picker.about.thanks')}</p>
      </ModalBody>
      <ModalFooter>
        <Button color="primary" onClick={onClose}>
          {t('picker.common.close')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};
