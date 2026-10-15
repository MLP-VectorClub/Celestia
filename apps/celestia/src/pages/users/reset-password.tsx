import { NextPage } from 'next';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/router';
import { FormEvent, useMemo, useState } from 'react';
import { Alert, Button, FormGroup, Input, Label } from 'reactstrap';

import Content from 'src/components/shared/Content';
import InlineIcon from 'src/components/shared/InlineIcon';
import StandardHeading from 'src/components/shared/StandardHeading';
import { describeApiError, fieldErrors, useApiMutation, useTitleSetter } from 'src/hooks';
import { UserService } from 'src/services/user';
import { useAppDispatch, wrapper } from 'src/store';
import { authActions } from 'src/store/slices';
import { AuthModalSide, SSRMessages, Translatable } from 'src/types';
import { TitleFactory } from 'src/types/title';
import { titleSetter } from 'src/utils/core';
import { typedServerSideTranslations } from 'src/utils/i18n';

const MIN_LENGTH = 8;
const MAX_LENGTH = 300;

const titleFactory: TitleFactory = () => {
  const title: Translatable = ['users.resetPassword.title'];
  return { title, breadcrumbs: [{ label: title, active: true }] };
};

/** The mail's link carries the token, exactly 64 hex digits */
const parseToken = (token: string | string[] | undefined) =>
  typeof token === 'string' && /^[0-9a-f]{64}$/i.test(token) ? token.toLowerCase() : null;

/** Where the link of the "forgot password" mail leads: a new password, set with the token from the link */
const ResetPasswordPage: NextPage = () => {
  const t = useTranslations();
  const dispatch = useAppDispatch();
  const { query } = useRouter();
  const [password, setPassword] = useState('');
  const [revealed, setRevealed] = useState(false);
  const titleData = useMemo(titleFactory, []);
  useTitleSetter(dispatch, titleData);

  const token = parseToken(query.token);
  const save = useApiMutation(() => UserService.resetPassword({ token: token!, newPassword: password }), {
    onSuccess: () => setPassword(''),
  });
  const errors = fieldErrors(save.error);
  const valid = password.length >= MIN_LENGTH && password.length <= MAX_LENGTH;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (token && valid && !save.isPending) save.mutate();
  };

  return (
    <Content>
      <StandardHeading heading={t('users.resetPassword.heading')} lead={t('users.resetPassword.lead')} />
      {!token && (
        <Alert color="danger" fade={false}>
          {t('users.resetPassword.invalid')}
        </Alert>
      )}
      {token && save.isSuccess && (
        <div className="text-center">
          <Alert color="success" fade={false} role="status">
            {t('users.resetPassword.done')}
          </Alert>
          <Button color="ui" id="reset-sign-in" onClick={() => dispatch(authActions.openAuthModal(AuthModalSide.SIGN_IN))}>
            <InlineIcon first icon="sign-in-alt" />
            {t('users.resetPassword.signIn')}
          </Button>
        </div>
      )}
      {token && !save.isSuccess && (
        <form id="reset-password-form" onSubmit={onSubmit}>
          <FormGroup>
            <Label for="reset-new-password">{t('users.resetPassword.newPassword')}</Label>
            <div className="d-flex gap-2 align-items-center flex-wrap">
              <Input
                id="reset-new-password"
                name="newPassword"
                type={revealed ? 'text' : 'password'}
                autoComplete="new-password"
                minLength={MIN_LENGTH}
                maxLength={MAX_LENGTH}
                required
                autoFocus
                style={{ maxWidth: '20rem' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                invalid={Boolean(errors.newPassword)}
              />
              <Button type="button" color="ui" id="reset-reveal" onClick={() => setRevealed(!revealed)}>
                <InlineIcon first icon={revealed ? 'eye-slash' : 'eye'} />
                {t(revealed ? 'users.account.password.conceal' : 'users.account.password.reveal')}
              </Button>
            </div>
            <small className="text-muted d-block mt-1">{t('users.resetPassword.hint')}</small>
            {errors.newPassword && <div className="invalid-feedback d-block">{errors.newPassword}</div>}
          </FormGroup>
          {save.error && !errors.newPassword && (
            <Alert color="danger" fade={false} role="alert">
              {errors.token ?? describeApiError(save.error)}{' '}
              {errors.token && (
                <Button
                  color="link"
                  size="sm"
                  className="p-0 align-baseline"
                  onClick={() => dispatch(authActions.openAuthModal(AuthModalSide.PASSWORD_RESET))}
                >
                  {t('users.resetPassword.askAgain')}
                </Button>
              )}
            </Alert>
          )}
          <Button color="green" id="reset-save" disabled={save.isPending || !valid}>
            <InlineIcon first loading={save.isPending} icon="check" />
            {t('users.resetPassword.save')}
          </Button>
        </form>
      )}
    </Content>
  );
};

export const getServerSideProps = wrapper.getServerSideProps<SSRMessages>((store) => async ({ locale }) => {
  titleSetter(store, titleFactory());
  return { props: { ...(await typedServerSideTranslations(locale, ['users'])) } };
});

export default ResetPasswordPage;
