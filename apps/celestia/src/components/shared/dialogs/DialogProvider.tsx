import { FC, PropsWithChildren, ReactNode, createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';
import { useTranslations } from 'next-intl';

export interface ConfirmOptions {
  title: ReactNode;
  body?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  color?: string;
}

interface DialogContextValue {
  /** Resolves with `true` when the user confirms and `false` when they cancel or close the dialog */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const DialogContext = createContext<DialogContextValue | null>(null);

export const useDialog = (): DialogContextValue => {
  const value = useContext(DialogContext);
  if (!value) throw new Error('useDialog needs a DialogProvider above it');
  return value;
};

export const DialogProvider: FC<PropsWithChildren> = ({ children }) => {
  const t = useTranslations();
  const [current, setCurrent] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((answer: boolean) => void) | null>(null);

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        // A new question replaces an unanswered one
        resolver.current?.(false);
        resolver.current = resolve;
        setCurrent(options);
      }),
    []
  );

  const answer = useCallback((value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setCurrent(null);
  }, []);

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <DialogContext.Provider value={value}>
      {children}
      <Modal className="modal-ui" centered isOpen={current !== null} toggle={() => answer(false)}>
        <ModalHeader toggle={() => answer(false)}>{current?.title}</ModalHeader>
        {current?.body && <ModalBody>{current.body}</ModalBody>}
        <ModalFooter>
          <Button color={current?.color ?? 'primary'} onClick={() => answer(true)} autoFocus>
            {current?.confirmLabel ?? t('common.actions.confirm')}
          </Button>
          <Button color="link" onClick={() => answer(false)}>
            {current?.cancelLabel ?? t('common.actions.cancel')}
          </Button>
        </ModalFooter>
      </Modal>
    </DialogContext.Provider>
  );
};
