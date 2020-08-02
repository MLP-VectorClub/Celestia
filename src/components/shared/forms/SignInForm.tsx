import { useDispatch, useSelector } from 'react-redux';
import {
  Alert,
  Button,
  Col,
  CustomInput,
  Form,
  FormGroup,
  Input,
  InputGroup,
  InputGroupAddon,
  Label,
  Row,
  UncontrolledTooltip,
} from 'reactstrap';
import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from '../../../i18n';
import { RootState } from '../../../store/rootReducer';
import { AuthModalSide, Status, UnifiedErrorResponseTypes } from '../../../types';
import { authActions } from '../../../store/slices';
import InlineIcon from '../InlineIcon';
import BootstrapErrorMessages from '../BootstrapErrorMessages';
import { combineErrors, validateEmail, validatePassword, validateRequired } from '../../../utils';
import RevealPasswordButton from '../RevealPasswordButton';

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

// TODO Social (DeviantArt & Discord) login

const SingInForm: React.FC = () => {
  const { t } = useTranslation('common');
  const { register: r, handleSubmit, errors: clientErrors, reset } = useForm<FormFields>({ validateCriteriaMode: 'all' });
  const dispatch = useDispatch();
  const { authModal, signIn } = useSelector((store: RootState) => store.auth);
  const [passwordRevealed, setPasswordRevealed] = useState(false);
  const [rateLimitTimeout, setRateLimitTimeout] = useState<null | ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (!authModal.open) {
      reset();
      setPasswordRevealed(false);
    }
  }, [reset, authModal.open]);

  useEffect(() => {
    const clearRateLimitTimeout = () => {
      if (rateLimitTimeout) {
        clearTimeout(rateLimitTimeout);
        setRateLimitTimeout(null);
      }
    };

    if (signIn.error?.type !== UnifiedErrorResponseTypes.RATE_LIMITED) {
      clearRateLimitTimeout();
      return;
    }

    setRateLimitTimeout(setTimeout(clearRateLimitTimeout, signIn.error.retryAfter * 1e3));
  }, [signIn.error]);

  const onSubmit: Parameters<typeof handleSubmit>[0] = data => {
    dispatch(authActions.signIn({
      email: data[INPUT_NAMES.EMAIL],
      password: data[INPUT_NAMES.PASSWORD],
      remember: Boolean(data[INPUT_NAMES.REMEMBER]),
    }));
  };
  const isLoading = signIn.status === Status.LOAD;
  const errors = combineErrors(clientErrors, signIn.error);

  const requiredValidation = validateRequired(t);
  const emailValidation = validateEmail<FormFields>(t);
  const passwordValidation = validatePassword(t);

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <p className="text-center">
        <a href="#" onClick={() => dispatch(authActions.openAuthModal(AuthModalSide.REGISTER))}>
          {t('auth.noAccountYet')}
        </a>
      </p>

      <p className="text-center text-info">
        <FontAwesomeIcon icon="info" className="mr-2" />
        {t('auth.loginBenefits')}
      </p>

      <FormGroup row>
        <Label htmlFor={INPUT_NAMES.EMAIL} className="text-right" sm={4}>
          {t('auth.email')}
        </Label>
        <Col sm={8}>
          <Input
            type="email"
            defaultValue=""
            name={INPUT_NAMES.EMAIL}
            innerRef={r({
              ...requiredValidation,
              validate: emailValidation,
            })}
            invalid={INPUT_NAMES.EMAIL in errors}
            disabled={isLoading}
          />
          <BootstrapErrorMessages errors={errors} name={INPUT_NAMES.EMAIL} />
        </Col>
      </FormGroup>

      <FormGroup row>
        <Label htmlFor={INPUT_NAMES.PASSWORD} className="text-right" sm={4}>
          {t('auth.password')}
        </Label>
        <Col sm={8}>
          <InputGroup>
            <Input
              type={passwordRevealed ? 'text' : 'password'}
              defaultValue=""
              name={INPUT_NAMES.PASSWORD}
              innerRef={r({
                ...requiredValidation,
                ...passwordValidation,
              })}
              invalid={Boolean(errors[INPUT_NAMES.PASSWORD])}
              disabled={isLoading}
              autocomplete="current-password"
            />
            <InputGroupAddon addonType="append">
              <RevealPasswordButton
                passwordRevealed={passwordRevealed}
                setPasswordRevealed={setPasswordRevealed}
              />
            </InputGroupAddon>
          </InputGroup>
          <BootstrapErrorMessages errors={errors} name={INPUT_NAMES.PASSWORD} />
        </Col>
      </FormGroup>

      <FormGroup>
        <CustomInput type="checkbox" name={INPUT_NAMES.REMEMBER} label={t('auth.rememberMe')} id="remember-me" innerRef={r()} />
      </FormGroup>

      {signIn.error?.type === UnifiedErrorResponseTypes.AUTHENTICATION_ERROR && (
        <Alert color="danger">{t('auth.invalidCredentials')}</Alert>
      )}

      {signIn.error?.type === UnifiedErrorResponseTypes.MESSAGE_ONLY && (
        <Alert color="danger">{signIn.error.message}</Alert>
      )}

      {signIn.error?.type === UnifiedErrorResponseTypes.RATE_LIMITED && (
        <Alert color="danger">
          {t('auth.rateLimited', { count: signIn.error.retryAfter })}
        </Alert>
      )}

      <Row className="align-items-center">
        <Col>
          <Button color="ui" size="lg" disabled={isLoading || rateLimitTimeout !== null}>
            <InlineIcon first loading={isLoading} icon="sign-in-alt" />
            {t('auth.signInButton')}
          </Button>
        </Col>
        <Col className="text-right">
          <Button type="button" color="link" id="forgot-pw" aria-readonly="true">
            {t('auth.forgotPassword')}
          </Button>
          <UncontrolledTooltip target="forgot-pw" fade={false}>
            <InlineIcon icon="exclamation-triangle" color="warning" first />
            {t('auth.pwResetNotYetAvailable')}
          </UncontrolledTooltip>
        </Col>
      </Row>
    </Form>
  );
};

export default SingInForm;
