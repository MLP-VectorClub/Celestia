import { useQueryClient } from '@tanstack/react-query';
import { map } from 'lodash';
import { useTranslations } from 'next-intl';
import { FC, MouseEventHandler, useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSelector } from 'react-redux';
import { Alert, Button, Col, Form, FormGroup, Input, InputGroup, Label, Row } from 'reactstrap';
import { fromEvent } from 'rxjs';

import BootstrapErrorMessages from 'src/components/shared/BootstrapErrorMessages';
import InlineIcon from 'src/components/shared/InlineIcon';
import RevealPasswordButton from 'src/components/shared/RevealPasswordButton';
import { API_PREFIX } from 'src/config';
import { SOCIAL_PROVIDERS } from 'src/fancy-config';
import { describeApiError } from 'src/hooks/mutation';
import { passkeyErrorMessage, usePasskeyAutofill, usePasskeysSupported } from 'src/hooks/passkey';
import { useRateLimitLock } from 'src/hooks/rate-limit';
import { UserService } from 'src/services/user';
import { RootState, useAppDispatch } from 'src/store';
import { authActions } from 'src/store/slices';
import { signInPasskeyThunk, signInThunk } from 'src/store/thunks';
import { AuthModalSide, Nullable, Status, UnifiedErrorResponseTypes } from 'src/types';
import { SocialProvider } from 'src/types/auth';
import { ENDPOINTS, combineErrors, popupOpenCenter, validateEmail, validatePassword, validateRequired } from 'src/utils';
import { listenForOAuthResult } from 'src/utils/oauth-popup';
import { signInWithPasskeyOptions } from 'src/utils/passkeys';

enum INPUT_NAMES {
  EMAIL = 'email',
  PASSWORD = 'current-password',
  REMEMBER = 'remember',
}

type FormFields = {
  [INPUT_NAMES.EMAIL]: string;
  [INPUT_NAMES.PASSWORD]: string;
  [INPUT_NAMES.REMEMBER]: string;
};

interface SocialPopupRef {
  window: Nullable<Window | null>;
}

const SingInForm: FC = () => {
  const t = useTranslations();
  const {
    register: r,
    handleSubmit,
    formState: { errors: clientErrors },
    reset,
  } = useForm<FormFields>({ criteriaMode: 'all' });
  const dispatch = useAppDispatch();
  const { authModal, signIn, passkey } = useSelector((store: RootState) => store.auth);
  const [passwordRevealed, setPasswordRevealed] = useState(false);
  const socialAuthPopup = useRef<SocialPopupRef>({ window: null });
  const queryClient = useQueryClient();
  const rateLimited = useRateLimitLock(signIn.error);
  const [passkeyBusy, setPasskeyBusy] = useState(false);
  const [passkeyMessage, setPasskeyMessage] = useState<string | null>(null);
  // Passkeys the browser offers in the e-mail field's dropdown, while the dialog is up
  usePasskeyAutofill(authModal.open);
  const passkeysSupported = usePasskeysSupported();

  useEffect(() => {
    if (!authModal.open) {
      reset();
      setPasswordRevealed(false);
    }
  }, [reset, authModal.open]);

  useEffect(() => {
    const subscription = fromEvent(window, 'beforeunload').subscribe(() => {
      if (socialAuthPopup.current.window) {
        socialAuthPopup.current.window.close();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWith = useCallback(
    (provider: SocialProvider, popupTitle: string): MouseEventHandler =>
      (e) => {
        e.preventDefault();

        socialAuthPopup.current.window = popupOpenCenter(
          API_PREFIX + ENDPOINTS.USERS_OAUTH_SIGNIN_PROVIDER({ provider }),
          popupTitle,
          screen.availWidth * 0.75,
          screen.availHeight * 0.75
        );

        // The popup reports back over a BroadcastChannel, its `closed` state can't be trusted (see oauth-popup.ts)
        listenForOAuthResult(() => void queryClient.invalidateQueries({ queryKey: [ENDPOINTS.USERS_ME] }));
      },
    [queryClient]
  );

  const signInWithPasskey = async () => {
    setPasskeyMessage(null);
    setPasskeyBusy(true);
    try {
      const { data } = await UserService.passkeyOptions();
      const credential = await signInWithPasskeyOptions(data.options);
      await dispatch(signInPasskeyThunk({ challenge: data.challenge, credential, remember: true }));
    } catch (e) {
      setPasskeyMessage(passkeyErrorMessage(e, t('common.auth.passkey.failed')));
    } finally {
      setPasskeyBusy(false);
    }
  };

  const onSubmit: Parameters<typeof handleSubmit>[0] = useCallback(
    (data) =>
      void dispatch(
        signInThunk({
          email: data[INPUT_NAMES.EMAIL],
          password: data[INPUT_NAMES.PASSWORD],
          remember: Boolean(data[INPUT_NAMES.REMEMBER]),
        })
      ),
    [dispatch]
  );
  const isLoading = signIn.status === Status.LOAD;
  const errors = combineErrors(clientErrors, signIn.error);

  const requiredValidation = validateRequired(t);
  const emailValidation = validateEmail<FormFields>(t);
  const passwordValidation = validatePassword(t);

  const { ref: emailInputRef, ...emailInputRegister } = r(INPUT_NAMES.EMAIL, {
    ...requiredValidation,
    validate: emailValidation,
  });
  const { ref: passwordInputRef, ...passwordInputRegister } = r(INPUT_NAMES.PASSWORD, {
    ...requiredValidation,
    ...passwordValidation,
  });

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <p className="text-center">
        <a href="#" onClick={() => dispatch(authActions.openAuthModal(AuthModalSide.REGISTER))}>
          {t('common.auth.noAccountYet')}
        </a>
      </p>

      <FormGroup row>
        <Label htmlFor={INPUT_NAMES.EMAIL} className="text-end" sm={4}>
          {t('common.auth.email')}
        </Label>
        <Col sm={8}>
          <Input
            type="email"
            defaultValue=""
            {...emailInputRegister}
            innerRef={emailInputRef}
            invalid={INPUT_NAMES.EMAIL in errors}
            disabled={isLoading}
            // `webauthn` makes the browser offer the saved passkeys here (see usePasskeyAutofill)
            autoComplete="username webauthn"
          />
          <BootstrapErrorMessages errors={errors} name={INPUT_NAMES.EMAIL} />
        </Col>
      </FormGroup>

      <FormGroup row>
        <Label htmlFor={INPUT_NAMES.PASSWORD} className="text-end" sm={4}>
          {t('common.auth.password')}
        </Label>
        <Col sm={8}>
          <InputGroup>
            <Input
              type={passwordRevealed ? 'text' : 'password'}
              defaultValue=""
              {...passwordInputRegister}
              innerRef={passwordInputRef}
              invalid={Boolean(errors[INPUT_NAMES.PASSWORD])}
              disabled={isLoading}
              autoComplete="current-password"
            />
            <RevealPasswordButton passwordRevealed={passwordRevealed} setPasswordRevealed={setPasswordRevealed} />
          </InputGroup>
          <BootstrapErrorMessages errors={errors} name={INPUT_NAMES.PASSWORD} />
        </Col>
      </FormGroup>

      <FormGroup>
        <div className="form-check">
          <Input type="checkbox" className="form-check-input" id="remember-me" {...r(INPUT_NAMES.REMEMBER)} />
          <Label check htmlFor="remember-me" className="form-check-label">
            {t('common.auth.rememberMe')}
          </Label>
        </div>
      </FormGroup>

      {signIn.error?.type === UnifiedErrorResponseTypes.AUTHENTICATION_ERROR && (
        <Alert color="danger">{t('common.auth.invalidCredentials')}</Alert>
      )}

      {(passkeyMessage || (passkey.error && passkey.error.type !== UnifiedErrorResponseTypes.AUTHENTICATION_ERROR)) && (
        <Alert color="danger">{passkeyMessage ?? (passkey.error ? describeApiError(passkey.error) : null)}</Alert>
      )}
      {passkey.error?.type === UnifiedErrorResponseTypes.AUTHENTICATION_ERROR && (
        <Alert color="danger">{t('common.auth.passkey.rejected')}</Alert>
      )}

      {signIn.error?.type === UnifiedErrorResponseTypes.MESSAGE_ONLY && <Alert color="danger">{signIn.error.message}</Alert>}

      {(signIn.error?.type === UnifiedErrorResponseTypes.READ_ONLY || signIn.error?.type === UnifiedErrorResponseTypes.BACKEND_DOWN) && (
        <Alert color="warning">{describeApiError(signIn.error)}</Alert>
      )}

      {signIn.error?.type === UnifiedErrorResponseTypes.RATE_LIMITED && (
        <Alert color="danger">
          {t('common.auth.rateLimited', {
            count: signIn.error.retryAfter,
          })}
        </Alert>
      )}

      <Row className="align-items-center">
        <Col>
          <Button color="ui" size="lg" disabled={isLoading || rateLimited}>
            <InlineIcon first loading={isLoading} icon="sign-in-alt" />
            {t('common.auth.signInButton')}
          </Button>
        </Col>
        <Col className="text-end">
          <Button
            type="button"
            color="link"
            id="forgot-pw"
            onClick={() => dispatch(authActions.openAuthModal(AuthModalSide.PASSWORD_RESET))}
          >
            {t('common.auth.forgotPassword')}
          </Button>
        </Col>
      </Row>

      <FormGroup tag="fieldset" className="text-center border-top mt-3 pt-3">
        <legend className="text-uppercase float-none w-auto mx-auto px-2">
          <small>{t('common.auth.socialSignIn.alternatively')}</small>
        </legend>
        {passkeysSupported && (
          <Button
            type="button"
            color="ui"
            className="mx-2"
            id="passkey-sign-in"
            disabled={passkeyBusy || isLoading}
            onClick={() => void signInWithPasskey()}
          >
            <InlineIcon first loading={passkeyBusy} icon="fingerprint" />
            {t('common.auth.passkey.signIn')}
          </Button>
        )}
        {map(SOCIAL_PROVIDERS, ({ name, renderIcon: RenderIcon }, provider: SocialProvider) => {
          const text = t('common.auth.socialSignIn.signInWith', {
            provider: name,
          });
          return (
            <Button type="button" key={provider} color={provider} className="mx-2" onClick={signInWith(provider, text)}>
              <RenderIcon first />
              {text}
            </Button>
          );
        })}
      </FormGroup>
    </Form>
  );
};

export default SingInForm;
