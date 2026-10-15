import { useTranslations } from 'next-intl';
import { FC, useState } from 'react';
import { useSelector } from 'react-redux';
import { Button, Tooltip } from 'reactstrap';

import ButtonRow from 'src/components/shared/ButtonRow';
import InlineIcon from 'src/components/shared/InlineIcon';
import { RootState, useAppDispatch } from 'src/store';
import { signOutThunk } from 'src/store/thunks';
import { Status } from 'src/types';

const BUTTON_ID = 'signout';

const SignOutButton: FC = () => {
  const t = useTranslations();
  const dispatch = useAppDispatch();
  const { signOut } = useSelector((state: RootState) => state.auth);
  const [signOutConfirm, setSignOutConfirm] = useState(false);

  const handleSignOut = () => {
    void dispatch(signOutThunk());
    setSignOutConfirm(false);
  };

  return (
    <>
      <Button id={BUTTON_ID} onClick={() => setSignOutConfirm(true)} disabled={signOut.status === Status.LOAD} data-testid="auth-signout">
        <InlineIcon first icon="sign-out-alt" loading={signOut.status === Status.LOAD} />
        {t('common.sidebar.signOut')}
      </Button>
      <Tooltip isOpen={signOutConfirm} target={BUTTON_ID} container="sidebar" placement="bottom" className="tooltip-interactive">
        <p className="mb-1">{t('common.sidebar.confirmSignOut')}</p>
        <ButtonRow justify="center">
          <Button size="sm" color="success" onClick={handleSignOut} data-testid="dialog-btn-confirm">
            <InlineIcon icon="check" fixedWidth />
          </Button>
          <Button size="sm" color="danger" onClick={() => setSignOutConfirm(false)}>
            <InlineIcon icon="times" fixedWidth />
          </Button>
        </ButtonRow>
      </Tooltip>
    </>
  );
};

export default SignOutButton;
