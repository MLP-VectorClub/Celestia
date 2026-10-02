import { useTranslations } from 'next-intl';
import { FC, useState } from 'react';
import { Alert, Button, FormGroup, FormText, Input, Label } from 'reactstrap';

import { describeApiError, fieldErrors, useApiMutation } from 'src/hooks';
import { AccountService } from 'src/services/account';

const MIN_LENGTH = 3;
const MAX_LENGTH = 128;

/** Ask for a new e-mail address; it only changes once the link in the mail sent to that address is opened */
export const EmailChangeForm: FC<{ userId: number }> = ({ userId }) => {
  const t = useTranslations();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const request = useApiMutation(
    () => AccountService.requestEmailChange(userId, { newEmail: email.trim(), ...(password ? { currentPassword: password } : {}) }),
    {
      onSuccess: () => setPassword(''),
    }
  );
  const resend = useApiMutation(() => AccountService.requestEmailChange(userId, { resend: true }));
  const errors = fieldErrors(request.error);
  const valid = email.trim().length >= MIN_LENGTH && email.trim().length <= MAX_LENGTH;
  const sent = request.data?.message ?? resend.data?.message;
  const error = request.error && !errors.newEmail && !errors.currentPassword ? request.error : resend.error;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (valid && !request.isPending) request.mutate();
      }}
    >
      <FormGroup>
        <Label for="email-new">{t('users.account.email.new')}</Label>
        <Input
          id="email-new"
          type="email"
          autoComplete="email"
          minLength={MIN_LENGTH}
          maxLength={MAX_LENGTH}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          invalid={Boolean(errors.newEmail)}
        />
        {errors.newEmail && <div className="invalid-feedback d-block">{errors.newEmail}</div>}
        <FormText>{t('users.account.email.newHelp')}</FormText>
      </FormGroup>
      <FormGroup>
        <Label for="email-password">{t('users.account.email.password')}</Label>
        <Input
          id="email-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          invalid={Boolean(errors.currentPassword)}
        />
        {errors.currentPassword && <div className="invalid-feedback d-block">{errors.currentPassword}</div>}
        <FormText>{t('users.account.email.passwordHelp')}</FormText>
      </FormGroup>
      {error && (
        <Alert color="danger" fade={false} role="alert">
          {describeApiError(error)}
        </Alert>
      )}
      {sent && (
        <Alert color="success" fade={false} role="status">
          {sent}
        </Alert>
      )}
      <div className="d-flex flex-wrap gap-2">
        <Button color="primary" disabled={!valid || request.isPending}>
          {t('users.account.email.submit')}
        </Button>
        <Button type="button" color="link" disabled={resend.isPending} onClick={() => resend.mutate()}>
          {t('users.account.email.resend')}
        </Button>
      </div>
    </form>
  );
};
