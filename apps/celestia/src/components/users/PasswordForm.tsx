import { useTranslations } from 'next-intl';
import { FC, useState } from 'react';
import { Alert, Button, FormGroup, FormText, Input, Label } from 'reactstrap';

import { describeApiError, fieldErrors, useApiMutation } from 'src/hooks';
import { AccountService } from 'src/services/account';
import { useAppDispatch } from 'src/store';
import { authActions } from 'src/store/slices';
import { AuthModalSide } from 'src/types';
import { ENDPOINTS } from 'src/utils';

const MIN_LENGTH = 8;
const MAX_LENGTH = 300;

/** Change the signed in user's password. All sessions end afterwards, so the sign in dialog opens */
export const PasswordForm: FC = () => {
  const t = useTranslations();
  const dispatch = useAppDispatch();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [repeat, setRepeat] = useState('');

  const save = useApiMutation(
    () => AccountService.changePassword({ ...(current ? { currentPassword: current } : {}), newPassword: next }),
    {
      invalidate: [[ENDPOINTS.USERS_ME]],
      onSuccess: () => {
        setCurrent('');
        setNext('');
        setRepeat('');
        dispatch(authActions.openAuthModal(AuthModalSide.SIGN_IN));
      },
    }
  );
  const errors = fieldErrors(save.error);
  const mismatch = repeat !== '' && repeat !== next;
  const valid = next.length >= MIN_LENGTH && next.length <= MAX_LENGTH && next === repeat;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (valid && !save.isPending) save.mutate();
      }}
    >
      <FormGroup>
        <Label for="password-current">{t('users.account.password.current')}</Label>
        <Input
          id="password-current"
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          invalid={Boolean(errors.currentPassword)}
        />
        {errors.currentPassword && <div className="invalid-feedback d-block">{errors.currentPassword}</div>}
        <FormText>{t('users.account.password.currentHelp')}</FormText>
      </FormGroup>
      <FormGroup>
        <Label for="password-new">{t('users.account.password.new')}</Label>
        <Input
          id="password-new"
          type="password"
          autoComplete="new-password"
          minLength={MIN_LENGTH}
          maxLength={MAX_LENGTH}
          value={next}
          onChange={(e) => setNext(e.target.value)}
          invalid={Boolean(errors.newPassword)}
        />
        {errors.newPassword && <div className="invalid-feedback d-block">{errors.newPassword}</div>}
        <FormText>{t('users.account.password.newHelp', { min: MIN_LENGTH, max: MAX_LENGTH })}</FormText>
      </FormGroup>
      <FormGroup>
        <Label for="password-repeat">{t('users.account.password.repeat')}</Label>
        <Input
          id="password-repeat"
          type="password"
          autoComplete="new-password"
          value={repeat}
          onChange={(e) => setRepeat(e.target.value)}
          invalid={mismatch}
        />
        {mismatch && <div className="invalid-feedback d-block">{t('users.account.password.mismatch')}</div>}
      </FormGroup>
      {save.error && !errors.currentPassword && !errors.newPassword && (
        <Alert color="danger" fade={false} role="alert">
          {describeApiError(save.error)}
        </Alert>
      )}
      <Button color="primary" disabled={!valid || save.isPending}>
        {t('users.account.password.submit')}
      </Button>
      <FormText tag="div" className="mt-2">
        {t('users.account.password.signOutNote')}
      </FormText>
    </form>
  );
};
