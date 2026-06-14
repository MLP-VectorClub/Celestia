import { Modal, ModalBody, ModalHeader } from 'reactstrap';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from 'src/store';
import { coreActions } from 'src/store/slices';
import ExternalLink from 'src/components/shared/ExternalLink';
import { DEV_EMAIL, DEVIANTART_GROUP_URL, DISCORD_INVITE_LINK } from 'src/config';
import { FC, ReactNode } from 'react';
import { useTranslations } from 'next-intl';

const ContactModal: FC = () => {
  const t = useTranslations();
  const dispatch = useAppDispatch();
  const { contactOpen } = useSelector((state: RootState) => state.core);
  const toggle = () => dispatch(coreActions.toggleContact());
  return (
    <Modal className="modal-info" centered isOpen={contactOpen} toggle={toggle}>
      <ModalHeader toggle={toggle}>{t('common.contact.header')}</ModalHeader>
      <ModalBody>
        <h3>{t('common.contact.howTo')}</h3>
        <p>{t('common.contact.useAnyBelow')}</p>
        <ul>
          <li>
            {t.rich('common.contact.discord', {
              link: (chunks: ReactNode) => <ExternalLink href={DISCORD_INVITE_LINK}>{chunks}</ExternalLink>,
              bold: (chunks: ReactNode) => <strong>{chunks}</strong>,
            })}
          </li>
          <li>
            {t.rich('common.contact.deviantart', {
              link: (chunks: ReactNode) => <ExternalLink href={`${DEVIANTART_GROUP_URL}/notes/`}>{chunks}</ExternalLink>,
            })}
          </li>
          <li>
            {t.rich('common.contact.email', {
              email: DEV_EMAIL,
              link: (chunks: ReactNode) => <a href={`mailto:${DEV_EMAIL}`}>{chunks}</a>,
            })}
          </li>
        </ul>
      </ModalBody>
    </Modal>
  );
};

export default ContactModal;
