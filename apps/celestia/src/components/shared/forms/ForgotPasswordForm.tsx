import { useTranslations } from 'next-intl';
import { FC, FormEvent, useState } from 'react';
import { Alert, Button, Form, FormGroup, Input, Label } from 'reactstrap';

import InlineIcon from 'src/components/shared/InlineIcon';
import { describeApiError, fieldErrors, useApiMutation } from 'src/hooks';
import { useRateLimitLock } from 'src/hooks/rate-limit';
import { UserService } from 'src/services/user';
import { useAppDispatch } from 'src/store';
import { authActions } from 'src/store/slices';
import { AuthModalSide } from 'src/types';

/** Asks for the e-mail address of the account and has Luna mail a link for choosing a new password. The answer is the same for any address */
const ForgotPasswordForm: FC = () => {
  const t = useTranslations();
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState('');
  const send = useApiMutation(() => UserService.forgotPassword(email.trim()));
  const rateLimited = useRateLimitLock(send.error);
  const errors = fieldErrors(send.error);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (email.trim() && !send.isPending && !rateLimited) send.mutate();
  };

  return (
    <Form onSubmit={onSubmit} id="forgot-password-form">
      {send.isSuccess ? (
        <Alert color="success" fade={false} role="status">
          {t('common.auth.forgot.sent')}
        </Alert>
      ) : (
        <>
          <p>{t('common.auth.forgot.intro')}</p>
          <FormGroup>
            <Label htmlFor="forgot-email">{t('common.auth.email')}</Label>
            <Input
              id="forgot-email"
              name="email"
              type="email"
              autoComplete="email"
              autoFocus
              required
              value={email}
              disabled={send.isPending}
              onChange={(e) => setEmail(e.target.value)}
              invalid={Boolean(errors.email)}
            />
            {errors.email && <div className="invalid-feedback d-block">{errors.email}</div>}
          </FormGroup>
          {send.error && !errors.email && (
            <Alert color="danger" fade={false} role="alert">
              {describeApiError(send.error)}
            </Alert>
          )}
          <Button color="ui" size="lg" disabled={send.isPending || rateLimited || !email.trim()}>
            <InlineIcon first loading={send.isPending} icon="envelope" />
            {t('common.auth.forgot.send')}
          </Button>
        </>
      )}
      <div className="mt-3">
        <Button
          type="button"
          color="link"
          className="p-0"
          id="forgot-back"
          onClick={() => dispatch(authActions.openAuthModal(AuthModalSide.SIGN_IN))}
        >
          {t('common.auth.forgot.back')}
        </Button>
      </div>
    </Form>
  );
};

export default ForgotPasswordForm;
