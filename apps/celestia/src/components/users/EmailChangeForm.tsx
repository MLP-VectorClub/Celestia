import { useTranslations } from 'next-intl';
import { FC, useState } from 'react';
import { Alert, Button, FormGroup, FormText, Input, Label } from 'reactstrap';

import { UserProfile } from '@mlp-vectorclub/api-types';
import InlineIcon from 'src/components/shared/InlineIcon';
import TimeAgo from 'src/components/shared/TimeAgo';
import { describeApiError, fieldErrors, useApiMutation } from 'src/hooks';
import { AccountService } from 'src/services/account';

const MIN_LENGTH = 3;
const MAX_LENGTH = 128;

/**
 * Ask for a new e-mail address; it only changes once the link in the mail sent to that address is opened. Staff asking for someone else's
 * address do not need that user's password
 */
export const EmailChangeForm: FC<{ profile: UserProfile; sameUser: boolean }> = ({ profile, sameUser }) => {
  const t = useTranslations();
  const userId = profile.user.id;
  const current = profile.account?.email ?? null;
  const verifiedAt = profile.account?.emailVerifiedAt ?? null;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const request = useApiMutation(
    () => AccountService.requestEmailChange(userId, { newEmail: email.trim(), ...(password ? { currentPassword: password } : {}) }),
    { onSuccess: () => setPassword('') }
  );
  const resend = useApiMutation(() => AccountService.requestEmailChange(userId, { resend: true }));
  const errors = fieldErrors(request.error);
  const valid = email.trim().length >= MIN_LENGTH && email.trim().length <= MAX_LENGTH;
  const sent = request.data?.message ?? resend.data?.message;
  const error = request.error && !errors.newEmail && !errors.currentPassword ? request.error : resend.error;

  return (
    <>
      <h3>{t(current ? 'users.account.changeEmail' : 'users.account.setEmail')}</h3>
      {sameUser && (
        <>
          <p>{t('users.account.emailIntro1')}</p>
          <p>{t('users.account.emailIntro2')}</p>
        </>
      )}
      <form
        id="change-email"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid && !request.isPending) request.mutate();
        }}
      >
        <FormGroup>
          <Label for="current-email">{t('users.account.email.current')}</Label>
          {current ? (
            <>
              <Input id="current-email" type="email" readOnly value={current} />
              {verifiedAt ? (
                <FormText tag="div" className="text-success">
                  <InlineIcon icon="check" first />
                  {t('users.account.email.verified')} <TimeAgo date={verifiedAt} />
                </FormText>
              ) : (
                <FormText tag="div" className="text-warning">
                  {t('users.account.email.notVerified')}{' '}
                  <Button type="button" color="guide-link" size="sm" id="resend-verification" disabled={resend.isPending} onClick={() => resend.mutate()}>
                    <InlineIcon icon="sync" first />
                    {t('users.account.email.resend')}
                  </Button>
                </FormText>
              )}
            </>
          ) : (
            <FormText tag="div" className="text-primary">
              <InlineIcon icon="info-circle" first />
              {t('users.account.email.noAddress')}
            </FormText>
          )}
        </FormGroup>
        <FormGroup>
          <Label for="email-new">{t('users.account.email.new')}</Label>
          <Input
            id="email-new"
            name="newEmail"
            type="email"
            autoComplete="email"
            minLength={MIN_LENGTH}
            maxLength={MAX_LENGTH}
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            invalid={Boolean(errors.newEmail)}
          />
          {errors.newEmail && <div className="invalid-feedback d-block">{errors.newEmail}</div>}
        </FormGroup>
        {sameUser && (
          <FormGroup>
            <Label for="email-password">{t('users.account.email.password')}</Label>
            <Input
              id="email-password"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              invalid={Boolean(errors.currentPassword)}
            />
            {errors.currentPassword && <div className="invalid-feedback d-block">{errors.currentPassword}</div>}
          </FormGroup>
        )}
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
        <Button color="success" disabled={!valid || request.isPending}>
          <InlineIcon icon="envelope" first />
          {t('users.account.email.submit')}
        </Button>
      </form>
    </>
  );
};
