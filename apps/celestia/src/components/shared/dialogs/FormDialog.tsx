import { useTranslations } from 'next-intl';
import { FC, FormEventHandler, PropsWithChildren, ReactNode } from 'react';
import { Alert, Button, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';

import InlineIcon from 'src/components/shared/InlineIcon';

interface PropTypes extends PropsWithChildren {
  title: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  submitLabel: string;
  /** Disables the buttons and shows a spinner while the request is running */
  busy?: boolean;
  /** Shown above the buttons, e.g. a message returned by the API */
  error?: string | null;
}

/**
 * Modal around a form: Enter submits, the buttons lock while busy and the API's error stays inside the dialog
 */
export const FormDialog: FC<PropTypes> = ({ title, isOpen, onClose, onSubmit, submitLabel, busy = false, error = null, children }) => {
  const t = useTranslations();
  const handleSubmit: FormEventHandler = (e) => {
    e.preventDefault();
    if (!busy) onSubmit();
  };

  return (
    <Modal className="modal-ui" centered isOpen={isOpen} toggle={busy ? undefined : onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <ModalHeader toggle={busy ? undefined : onClose}>{title}</ModalHeader>
        <ModalBody>
          {children}
          {error && (
            <Alert color="danger" fade={false} className="mt-3 mb-0" role="alert">
              {error}
            </Alert>
          )}
        </ModalBody>
        <ModalFooter>
          <Button type="submit" color="primary" disabled={busy}>
            {busy && <InlineIcon loading first />}
            {submitLabel}
          </Button>
          <Button type="button" color="link" onClick={onClose} disabled={busy}>
            {t('common.actions.cancel')}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};
