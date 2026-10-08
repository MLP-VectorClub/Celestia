import { useTranslations } from 'next-intl';
import { FC, RefObject, useCallback, useRef, useState } from 'react';
import { Button, FormGroup, InputGroup, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';

import styles from 'modules/ShareAppearanceButton.module.scss';
import { SocialShareButtons } from 'src/components/colorguide/SocialShareButtons';
import InlineIcon from 'src/components/shared/InlineIcon';
import { useCopyToClipboard } from 'src/hooks/copy';

interface PropTypes {
  shortUrl?: string;
}

export const ShareAppearanceButton: FC<PropTypes> = ({ shortUrl }) => {
  const t = useTranslations();
  const [shareOpen, setShareOpen] = useState(false);
  const [shareVisible, setShareVisible] = useState(false);
  const copyButtonRef = useRef<HTMLButtonElement>(null) as RefObject<HTMLButtonElement>;
  const urlInputRef = useRef<HTMLElement>(null) as RefObject<HTMLElement>;
  const modalRef = useRef<HTMLElement>(null) as RefObject<HTMLElement>;

  const startSharing = useCallback(async () => {
    try {
      await navigator.share({ url: shortUrl, title: document.title });
    } catch (e) {
      setShareOpen(true);
    }
  }, [shortUrl]);
  const closeModal = useCallback(() => setShareOpen(false), []);
  const handleModalVisible = useCallback(() => setShareVisible(true), []);
  const handleModalHidden = useCallback(() => setShareVisible(false), []);

  const { tooltip, clearCopyStatus } = useCopyToClipboard({
    enabled: shareVisible,
    copyButtonRef,
    targetRef: urlInputRef,
    containerRef: modalRef,
  });

  if (!shortUrl) return null;

  return (
    <>
      <Button color="primary" size="sm" onClick={startSharing}>
        <InlineIcon icon="share" first />
        {t('colorGuide.share.button')}
      </Button>
      <Modal
        centered
        fade={false}
        isOpen={shareOpen}
        onExit={closeModal}
        innerRef={modalRef}
        onOpened={handleModalVisible}
        onClosed={handleModalHidden}
      >
        <ModalHeader className="bg-ui text-white">
          <InlineIcon icon="share" first />
          {t('colorGuide.share.title')}
        </ModalHeader>
        <ModalBody>
          <p>{t('colorGuide.share.help')}</p>
          <FormGroup>
            <InputGroup className="flex-nowrap">
              <span className={`input-group-text flex-grow-1 ${styles.appearanceLinkInput}`} ref={urlInputRef}>
                {shortUrl}
              </span>
              <Button color="secondary" innerRef={copyButtonRef} onMouseLeave={clearCopyStatus}>
                <InlineIcon icon="clipboard" first />
                {t('colorGuide.share.copy')}
              </Button>
            </InputGroup>
          </FormGroup>
          <FormGroup>
            <p className="h5">{t('colorGuide.share.social')}</p>
            <SocialShareButtons url={shortUrl} />
          </FormGroup>
        </ModalBody>
        <ModalFooter className="justify-content-center">
          <Button color="ui" onClick={closeModal}>
            {t('common.actions.close')}
          </Button>
        </ModalFooter>
      </Modal>
      {tooltip}
    </>
  );
};
