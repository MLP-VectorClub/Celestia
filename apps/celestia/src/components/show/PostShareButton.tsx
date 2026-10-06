import { useTranslations } from 'next-intl';
import { FC, RefObject, useRef, useState } from 'react';
import { Button, FormGroup, InputGroup, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';

import styles from 'modules/ShareAppearanceButton.module.scss';
import { IconButton } from 'src/components/shared/IconButton';
import InlineIcon from 'src/components/shared/InlineIcon';
import { APP_HOST } from 'src/config';
import { useCopyToClipboard } from 'src/hooks/copy';

/** Shows the post's own address (`/s/1z`) with a copy button, like the old site's "Share" button */
export const PostShareButton: FC<{ postId: number; compact?: boolean }> = ({ postId, compact = false }) => {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const copyButtonRef = useRef<HTMLButtonElement>(null) as RefObject<HTMLButtonElement>;
  const urlRef = useRef<HTMLElement>(null) as RefObject<HTMLElement>;
  const modalRef = useRef<HTMLElement>(null) as RefObject<HTMLElement>;
  const { tooltip, clearCopyStatus } = useCopyToClipboard({ enabled: visible, copyButtonRef, targetRef: urlRef, containerRef: modalRef });
  const url = `${APP_HOST}/s/${postId.toString(36)}`;

  return (
    <>
      {compact ? (
        <IconButton icon="share" color="blue" title={t('show.share.button')} onClick={() => setOpen(true)} />
      ) : (
        <Button color="blue" size="sm" onClick={() => setOpen(true)}>
          <InlineIcon icon="share" first />
          {t('show.share.button')}
        </Button>
      )}
      <Modal
        centered
        fade={false}
        isOpen={open}
        onExit={() => setOpen(false)}
        innerRef={modalRef}
        onOpened={() => setVisible(true)}
        onClosed={() => setVisible(false)}
      >
        <ModalHeader className="bg-ui text-white">
          <InlineIcon icon="share" first />
          {t('show.share.title', { id: postId })}
        </ModalHeader>
        <ModalBody>
          <p>{t('show.share.help')}</p>
          <FormGroup>
            <InputGroup>
              <span className={`input-group-text flex-grow-1 ${styles.appearanceLinkInput}`} ref={urlRef}>
                {url}
              </span>
              <Button color="secondary" innerRef={copyButtonRef} onMouseLeave={clearCopyStatus}>
                <InlineIcon icon="clipboard" first />
                {t('show.share.copy')}
              </Button>
            </InputGroup>
          </FormGroup>
        </ModalBody>
        <ModalFooter className="justify-content-center">
          <Button color="ui" onClick={() => setOpen(false)}>
            {t('common.actions.close')}
          </Button>
        </ModalFooter>
      </Modal>
      {tooltip}
    </>
  );
};
