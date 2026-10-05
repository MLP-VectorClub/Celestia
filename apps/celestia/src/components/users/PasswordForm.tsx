import { useTranslations } from 'next-intl';
import { FC, useState } from 'react';
import { Alert, Button, FormGroup, FormText, Input, Label } from 'reactstrap';

import InlineIcon from 'src/components/shared/InlineIcon';
import { describeApiError, fieldErrors, useApiMutation } from 'src/hooks';
import { AccountService } from 'src/services/account';
import { useAppDispatch } from 'src/store';
import { authActions } from 'src/store/slices';
import { AuthModalSide } from 'src/types';
import { ENDPOINTS } from 'src/utils';

const MIN_LENGTH = 8;
const MAX_LENGTH = 300;

/** Change (or create) the signed in user's password. All sessions end afterwards, so the sign in dialog opens */
export const PasswordForm: FC<{ passwordSet: boolean }> = ({ passwordSet }) => {
  const t = useTranslations();
  const dispatch = useAppDispatch();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [revealed, setRevealed] = useState(false);

  const save = useApiMutation(
    () => AccountService.changePassword({ ...(current ? { currentPassword: current } : {}), newPassword: next }),
    {
      invalidate: [[ENDPOINTS.USERS_ME]],
      onSuccess: () => {
        setCurrent('');
        setNext('');
        dispatch(authActions.openAuthModal(AuthModalSide.SIGN_IN));
      },
    }
  );
  const errors = fieldErrors(save.error);
  const valid = next.length >= MIN_LENGTH && next.length <= MAX_LENGTH;

  return (
    <>
      <h3>{t(passwordSet ? 'users.account.changePassword' : 'users.account.createPassword')}</h3>
      <p>{t('users.account.passwordIntro1')}</p>
      <p>{t('users.account.passwordIntro2')}</p>
      <form
        id="change-password"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid && !save.isPending) save.mutate();
        }}
      >
        <FormGroup>
          <Label for="password-current">{t('users.account.password.current')}</Label>
          {passwordSet ? (
            <Input
              id="password-current"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              invalid={Boolean(errors.currentPassword)}
            />
          ) : (
            <FormText tag="div" className="text-primary">
              <InlineIcon icon="info-circle" first />
              {t('users.account.password.noPassword')}
            </FormText>
          )}
          {errors.currentPassword && <div className="invalid-feedback d-block">{errors.currentPassword}</div>}
        </FormGroup>
        <FormGroup>
          <Label for="new-password-input">{t('users.account.password.new')}</Label>
          <div className="d-flex gap-2 align-items-center flex-wrap">
            <Input
              id="new-password-input"
              name="newPassword"
              type={revealed ? 'text' : 'password'}
              autoComplete="new-password"
              minLength={MIN_LENGTH}
              maxLength={MAX_LENGTH}
              required
              style={{ maxWidth: '20rem' }}
              value={next}
              onChange={(e) => setNext(e.target.value)}
              invalid={Boolean(errors.newPassword)}
            />
            <Button type="button" color="ui" id={revealed ? 'hide-new-password' : 'reveal-new-password'} onClick={() => setRevealed(!revealed)}>
              <InlineIcon icon={revealed ? 'eye-slash' : 'eye'} first />
              {t(revealed ? 'users.account.password.conceal' : 'users.account.password.reveal')}
            </Button>
          </div>
          {errors.newPassword && <div className="invalid-feedback d-block">{errors.newPassword}</div>}
          <FormText>{t('users.account.password.help')}</FormText>
        </FormGroup>
        {save.error && !errors.currentPassword && !errors.newPassword && (
          <Alert color="danger" fade={false} role="alert">
            {describeApiError(save.error)}
          </Alert>
        )}
        <Button color="success" disabled={!valid || save.isPending}>
          <InlineIcon icon="key" first />
          {t('users.account.password.submit')}
        </Button>
      </form>
    </>
  );
};
