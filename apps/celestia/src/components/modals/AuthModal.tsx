import { useTranslations } from 'next-intl';
import { FC, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSelector } from 'react-redux';
import { Modal, ModalBody, ModalHeader } from 'reactstrap';

import ForgotPasswordForm from 'src/components/shared/forms/ForgotPasswordForm';
import SingInForm from 'src/components/shared/forms/SignInForm';
import SignUpPanel from 'src/components/shared/forms/SignUpPanel';
import TwoFactorForm from 'src/components/shared/forms/TwoFactorForm';
import { useAuth } from 'src/hooks';
import { RootState, useAppDispatch } from 'src/store';
import { authActions } from 'src/store/slices';
import { AuthModalSide } from 'src/types';

const AuthModal: FC = () => {
  const t = useTranslations();
  const { reset } = useForm({ criteriaMode: 'all' });
  const dispatch = useAppDispatch();
  const { signedIn } = useAuth();
  const { authModal } = useSelector((store: RootState) => store.auth);

  useEffect(() => {
    if (!authModal.open) {
      reset();
    }
  }, [reset, authModal.open]);

  useEffect(() => {
    if (signedIn && authModal.open) {
      dispatch(authActions.closeAuthModal());
    }
  }, [authModal.open, dispatch, signedIn]);

  if (signedIn) return null;

  const toggleModal = () => dispatch(authModal.open ? authActions.closeAuthModal() : authActions.openAuthModal(null));

  const modalTitles = {
    [AuthModalSide.SIGN_IN]: t('common.auth.signInTitle'),
    [AuthModalSide.REGISTER]: t('common.auth.signUpTitle'),
    [AuthModalSide.PASSWORD_RESET]: t('common.auth.forgot.title'),
    [AuthModalSide.TWO_FACTOR]: t('common.auth.twoFactor.title'),
  };
  const modalTitle = modalTitles[authModal.side];

  const sides = {
    [AuthModalSide.SIGN_IN]: <SingInForm />,
    [AuthModalSide.REGISTER]: <SignUpPanel />,
    [AuthModalSide.PASSWORD_RESET]: <ForgotPasswordForm />,
    [AuthModalSide.TWO_FACTOR]: <TwoFactorForm />,
  };

  return (
    <Modal className="modal-ui" centered isOpen={authModal.open} toggle={toggleModal} backdrop="static">
      <ModalHeader toggle={toggleModal}>{modalTitle}</ModalHeader>
      <ModalBody>{sides[authModal.side]}</ModalBody>
    </Modal>
  );
};

export default AuthModal;
