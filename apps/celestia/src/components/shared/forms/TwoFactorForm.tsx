import { useTranslations } from 'next-intl';
import { FC, FormEvent, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Alert, Button, Form, FormGroup, Input, Label } from 'reactstrap';

import InlineIcon from 'src/components/shared/InlineIcon';
import { describeApiError, passkeyErrorMessage, usePasskeysSupported } from 'src/hooks';
import { useRateLimitLock } from 'src/hooks/rate-limit';
import { UserService } from 'src/services/user';
import { RootState, useAppDispatch } from 'src/store';
import { authActions } from 'src/store/slices';
import { signInTwoFactorPasskeyThunk, signInTwoFactorThunk } from 'src/store/thunks';
import { Status, UnifiedErrorResponseTypes } from 'src/types';
import { signInWithPasskeyOptions } from 'src/utils/passkeys';

type CodeMode = 'totp' | 'recovery';

/** The second step of signing in to an account with two-factor authentication: a code of the authenticator app, a recovery code or a passkey */
const TwoFactorForm: FC = () => {
  const t = useTranslations();
  const dispatch = useAppDispatch();
  const { twoFactor } = useSelector((store: RootState) => store.auth);
  const [mode, setMode] = useState<CodeMode>('totp');
  const [code, setCode] = useState('');
  const [passkeyBusy, setPasskeyBusy] = useState(false);
  const [passkeyMessage, setPasskeyMessage] = useState<string | null>(null);
  const rateLimited = useRateLimitLock(twoFactor.error);
  const passkeysSupported = usePasskeysSupported();
  const challenge = twoFactor.challenge;

  // Nothing to answer (the page was reloaded under the dialog, or the dialog was opened on this side by hand)
  useEffect(() => {
    if (!challenge) dispatch(authActions.backToSignIn());
  }, [challenge, dispatch]);

  if (!challenge) return null;

  const isLoading = twoFactor.status === Status.LOAD;
  const error = twoFactor.error;
  const expired = error?.type === UnifiedErrorResponseTypes.AUTHENTICATION_ERROR && error.expired === true;
  const canUseRecovery = challenge.methods.includes('recovery');

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const value = code.trim();
    if (!value || isLoading || rateLimited) return;
    void dispatch(
      signInTwoFactorThunk(
        mode === 'totp' ? { challenge: challenge.challenge, code: value } : { challenge: challenge.challenge, recoveryCode: value }
      )
    );
  };

  const answerWithPasskey = async () => {
    setPasskeyMessage(null);
    setPasskeyBusy(true);
    try {
      const { data } = await UserService.twoFactorPasskeyOptions(challenge.challenge);
      const credential = await signInWithPasskeyOptions(data.options);
      await dispatch(signInTwoFactorPasskeyThunk({ challenge: challenge.challenge, passkeyChallenge: data.challenge, credential }));
    } catch (err) {
      setPasskeyMessage(passkeyErrorMessage(err, t('common.auth.passkey.failed')));
    } finally {
      setPasskeyBusy(false);
    }
  };

  return (
    <Form onSubmit={onSubmit} id="two-factor-form">
      <p>{t(mode === 'totp' ? 'common.auth.twoFactor.introTotp' : 'common.auth.twoFactor.introRecovery')}</p>

      <FormGroup>
        <Label htmlFor="two-factor-code">{t(mode === 'totp' ? 'common.auth.twoFactor.code' : 'common.auth.twoFactor.recoveryCode')}</Label>
        <Input
          id="two-factor-code"
          name="code"
          autoFocus
          required
          value={code}
          disabled={isLoading || expired}
          onChange={(e) => setCode(e.target.value)}
          autoComplete="one-time-code"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          {...(mode === 'totp'
            ? { inputMode: 'numeric' as const, maxLength: 7, placeholder: '123456' }
            : { maxLength: 32, placeholder: 'abcde-fghij' })}
          invalid={Boolean(error) && !expired && error?.type === UnifiedErrorResponseTypes.AUTHENTICATION_ERROR}
        />
      </FormGroup>

      {error?.type === UnifiedErrorResponseTypes.AUTHENTICATION_ERROR && (
        <Alert color="danger" fade={false}>
          {t(
            expired
              ? 'common.auth.twoFactor.expired'
              : mode === 'totp'
                ? 'common.auth.twoFactor.invalidCode'
                : 'common.auth.twoFactor.invalidRecoveryCode'
          )}
        </Alert>
      )}
      {error?.type === UnifiedErrorResponseTypes.RATE_LIMITED && (
        <Alert color="danger" fade={false}>
          {t('common.auth.rateLimited', { count: error.retryAfter })}
        </Alert>
      )}
      {error && error.type !== UnifiedErrorResponseTypes.AUTHENTICATION_ERROR && error.type !== UnifiedErrorResponseTypes.RATE_LIMITED && (
        <Alert color="danger" fade={false}>
          {describeApiError(error)}
        </Alert>
      )}
      {passkeyMessage && (
        <Alert color="danger" fade={false}>
          {passkeyMessage}
        </Alert>
      )}

      <div className="d-flex flex-wrap gap-2 align-items-center">
        {expired ? (
          <Button type="button" color="ui" size="lg" onClick={() => dispatch(authActions.backToSignIn())}>
            <InlineIcon first icon="sign-in-alt" />
            {t('common.auth.twoFactor.startOver')}
          </Button>
        ) : (
          <Button color="ui" size="lg" disabled={isLoading || rateLimited || !code.trim()}>
            <InlineIcon first loading={isLoading} icon="sign-in-alt" />
            {t('common.auth.twoFactor.verify')}
          </Button>
        )}
      </div>

      {!expired && (
        <ul className="list-unstyled mt-3 mb-0">
          {canUseRecovery && (
            <li>
              <Button
                type="button"
                color="link"
                className="p-0"
                id="two-factor-switch-mode"
                onClick={() => {
                  setMode(mode === 'totp' ? 'recovery' : 'totp');
                  setCode('');
                  dispatch(authActions.clearTwoFactorError());
                }}
              >
                {t(mode === 'totp' ? 'common.auth.twoFactor.useRecovery' : 'common.auth.twoFactor.useApp')}
              </Button>
            </li>
          )}
          {challenge.methods.includes('passkey') && passkeysSupported && (
            <li>
              <Button
                type="button"
                color="link"
                className="p-0"
                id="two-factor-passkey"
                disabled={passkeyBusy || isLoading}
                onClick={() => void answerWithPasskey()}
              >
                <InlineIcon first loading={passkeyBusy} icon="fingerprint" />
                {t('common.auth.twoFactor.usePasskey')}
              </Button>
            </li>
          )}
          <li>
            <Button type="button" color="link" className="p-0" id="two-factor-back" onClick={() => dispatch(authActions.backToSignIn())}>
              {t('common.auth.twoFactor.back')}
            </Button>
          </li>
        </ul>
      )}
    </Form>
  );
};

export default TwoFactorForm;
