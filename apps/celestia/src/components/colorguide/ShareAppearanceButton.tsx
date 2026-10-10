import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { FC, RefObject, useCallback, useRef, useState } from 'react';
import { Alert, Button, FormGroup, InputGroup, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';

import styles from 'modules/ShareAppearanceButton.module.scss';
import { SocialShareButtons } from 'src/components/colorguide/SocialShareButtons';
import InlineIcon from 'src/components/shared/InlineIcon';
import { describeApiError, useApiMutation } from 'src/hooks';
import { useCopyToClipboard } from 'src/hooks/copy';
import { AppearanceEditService } from 'src/services/appearance-edit';

interface PropTypes {
  shortUrl?: string;
  /** The link carries the token that opens a private appearance for whoever has it */
  isPrivate?: boolean;
  /** Lets those who may manage a private appearance replace its link (which stops the old one from working); needs `isPrivate` */
  appearanceId?: number;
}

export const ShareAppearanceButton: FC<PropTypes> = ({ shortUrl, isPrivate = false, appearanceId }) => {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const [confirmingNewLink, setConfirmingNewLink] = useState(false);
  const [newLinkMade, setNewLinkMade] = useState(false);
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

  // Every query of the appearance learns the new token (the page may be open under an address with the old one); the dialog says it is done once the
  // link above shows the new one
  const [refreshing, setRefreshing] = useState(false);
  const newLink = useApiMutation(() => AppearanceEditService.clear(appearanceId!, { resetPrivKey: 1 } as never), {
    onSuccess: async () => {
      setRefreshing(true);
      await queryClient.invalidateQueries({
        predicate: (query) =>
          typeof query.queryKey[0] === 'string' && new RegExp(`^/appearances/${appearanceId}(\\?|$)`).test(query.queryKey[0]),
      });
      setRefreshing(false);
      setConfirmingNewLink(false);
      setNewLinkMade(true);
    },
  });
  const makingNewLink = newLink.isPending || refreshing;

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
          <p>{isPrivate ? t('colorGuide.share.privateHelp') : t('colorGuide.share.help')}</p>
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
          {isPrivate && appearanceId !== undefined && (
            <FormGroup>
              {confirmingNewLink ? (
                <Alert color="warning" fade={false} className="mb-0" role="alert">
                  <p>{t('colorGuide.share.newLinkWarning')}</p>
                  <Button
                    color="warning"
                    size="sm"
                    className="me-2"
                    data-testid="new-share-link-confirm"
                    disabled={newLink.isPending}
                    onClick={() => newLink.mutate()}
                  >
                    <InlineIcon icon="sync" first loading={makingNewLink} />
                    {t('colorGuide.share.newLinkConfirm')}
                  </Button>
                  <Button color="link" size="sm" disabled={makingNewLink} onClick={() => setConfirmingNewLink(false)}>
                    {t('common.actions.cancel')}
                  </Button>
                </Alert>
              ) : (
                <Button
                  color="link"
                  size="sm"
                  className="p-0"
                  data-testid="new-share-link"
                  onClick={() => {
                    setNewLinkMade(false);
                    newLink.reset();
                    setConfirmingNewLink(true);
                  }}
                >
                  <InlineIcon icon="sync" first />
                  {t('colorGuide.share.newLink')}
                </Button>
              )}
              {newLinkMade && !confirmingNewLink && <p className="text-success small mb-0 mt-1">{t('colorGuide.share.newLinkMade')}</p>}
              {newLink.error && (
                <Alert color="danger" fade={false} className="mt-2 mb-0" role="alert">
                  {describeApiError(newLink.error)}
                </Alert>
              )}
            </FormGroup>
          )}
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
