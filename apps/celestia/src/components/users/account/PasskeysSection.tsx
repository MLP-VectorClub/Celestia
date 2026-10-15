import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { FC, FormEvent, useState } from 'react';
import { Alert, Button, FormGroup, Input, Label } from 'reactstrap';

import InlineIcon from 'src/components/shared/InlineIcon';
import TimeAgo from 'src/components/shared/TimeAgo';
import { IdentityProofField, proofNeeded, proofOf } from 'src/components/users/account/IdentityProofField';
import { TWO_FACTOR_KEY } from 'src/components/users/account/TwoFactorSection';
import { describeApiError, fieldErrors, passkeyErrorMessage, useApiMutation, useAuth, usePasskeysSupported } from 'src/hooks';
import { AccountService } from 'src/services/account';
import { AccountPasskey, TwoFactorStatus } from 'src/types/auth';
import { httpResponseMapper } from 'src/utils/common';
import { isAlreadyRegistered, registerPasskeyOptions } from 'src/utils/passkeys';

const PASSKEYS_KEY = '/users/me/passkeys';

const PasskeyRow: FC<{ passkey: AccountPasskey; status: TwoFactorStatus }> = ({ passkey, status }) => {
  const t = useTranslations();
  const [name, setName] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const [proof, setProof] = useState('');
  const rename = useApiMutation((newName: string) => AccountService.renamePasskey(passkey.id, newName), {
    invalidate: [[PASSKEYS_KEY]],
    onSuccess: () => setName(null),
  });
  const remove = useApiMutation(() => AccountService.deletePasskey(passkey.id, proofOf(status, proof)), { invalidate: [[PASSKEYS_KEY]] });
  const error = fieldErrors(remove.error);

  return (
    <li id={`passkey-${passkey.id}`} className="border rounded p-2 mb-2">
      {name === null ? (
        <div className="d-flex flex-wrap gap-2 align-items-center">
          <InlineIcon icon="fingerprint" />
          <strong className="passkey-name">{passkey.name}</strong>
          <Button type="button" color="link" size="sm" className="rename" onClick={() => setName(passkey.name)}>
            <InlineIcon first icon="pencil-alt" />
            {t('users.account.passkeys.rename')}
          </Button>
          <Button type="button" color="red" size="sm" className="remove" onClick={() => setRemoving(true)}>
            <InlineIcon first icon="trash" />
            {t('users.account.passkeys.remove')}
          </Button>
        </div>
      ) : (
        <form
          className="d-flex flex-wrap gap-2 align-items-center"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            if (name.trim() && !rename.isPending) rename.mutate(name.trim());
          }}
        >
          <Input
            aria-label={t('users.account.passkeys.name')}
            value={name}
            maxLength={64}
            autoFocus
            style={{ maxWidth: '16rem' }}
            onChange={(e) => setName(e.target.value)}
          />
          <Button color="green" size="sm" disabled={rename.isPending || !name.trim()}>
            <InlineIcon first loading={rename.isPending} icon="check" />
            {t('users.account.passkeys.save')}
          </Button>
          <Button type="button" color="link" size="sm" onClick={() => setName(null)}>
            {t('common.actions.cancel')}
          </Button>
        </form>
      )}
      {removing && (
        <form
          className="mt-2"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            if (!remove.isPending) remove.mutate();
          }}
        >
          <p className="mb-2">{t('users.account.passkeys.removeBody', { name: passkey.name })}</p>
          <IdentityProofField
            status={status}
            id={`passkey-${passkey.id}-proof`}
            value={proof}
            onChange={setProof}
            error={error.currentPassword ?? error.code}
          />
          <div className="d-flex gap-2">
            <Button
              color="red"
              size="sm"
              className="confirm-remove"
              disabled={remove.isPending || (proofNeeded(status) !== null && !proof)}
            >
              <InlineIcon first loading={remove.isPending} icon="trash" />
              {t('users.account.passkeys.remove')}
            </Button>
            <Button type="button" color="link" size="sm" onClick={() => setRemoving(false)}>
              {t('common.actions.cancel')}
            </Button>
          </div>
        </form>
      )}
      <small className="d-block mt-1">
        {t('users.account.created')} <TimeAgo date={passkey.createdAt} />
        {' · '}
        {passkey.lastUsedAt ? (
          <>
            {t('users.account.lastUsed')} <TimeAgo date={passkey.lastUsedAt} />
          </>
        ) : (
          t('users.account.passkeys.neverUsed')
        )}
      </small>
      {remove.error && !Object.keys(error).length && (
        <Alert color="danger" fade={false} role="alert" className="mt-2 mb-0">
          {describeApiError(remove.error)}
        </Alert>
      )}
      {rename.error && (
        <Alert color="danger" fade={false} role="alert" className="mt-2 mb-0">
          {describeApiError(rename.error)}
        </Alert>
      )}
    </li>
  );
};

/** The passkeys of the account: the devices and password managers that can sign in without the password, added, renamed and removed here */
export const PasskeysSection: FC = () => {
  const t = useTranslations();
  const { signedIn } = useAuth();
  const supported = usePasskeysSupported();
  const list = useQuery({
    queryKey: [PASSKEYS_KEY],
    queryFn: () => AccountService.getPasskeys().then((r) => r.data),
    enabled: signedIn,
    refetchOnMount: 'always',
  });
  // Shared with the two-factor section: says whether changes are confirmed with the password
  const status = useQuery({
    queryKey: [TWO_FACTOR_KEY],
    queryFn: () => AccountService.getTwoFactor().then((r) => r.data),
    enabled: signedIn,
  });

  const [proof, setProof] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | undefined>();
  const proofFor = () => (status.data ? proofOf(status.data, proof) : {});

  const heading = (
    <h3 id="passkeys">
      <InlineIcon first icon="fingerprint" />
      {t('users.account.passkeys.heading')}
    </h3>
  );

  const add = async (e: FormEvent) => {
    e.preventDefault();
    setFailure(null);
    setFieldError(undefined);
    setBusy(true);
    try {
      // Options first (that is where the password is asked for), then the browser's prompt, then what it made
      const { data } = await AccountService.passkeyRegistrationOptions(proofFor());
      const credential = await registerPasskeyOptions(data.options);
      await AccountService.registerPasskey({ challenge: data.challenge, credential, ...(name.trim() ? { name: name.trim() } : {}) });
      setName('');
      setProof('');
      await list.refetch();
    } catch (err) {
      const mapped = typeof err === 'object' && err !== null && 'isAxiosError' in err ? httpResponseMapper(err) : null;
      const fields = fieldErrors(mapped);
      if (fields.currentPassword || fields.code) setFieldError(fields.currentPassword ?? fields.code);
      else if (isAlreadyRegistered(err)) setFailure(t('users.account.passkeys.alreadyHere'));
      else setFailure(passkeyErrorMessage(err, t('users.account.passkeys.failed')));
    } finally {
      setBusy(false);
    }
  };

  if (supported === false && !list.data?.length) {
    return (
      <section>
        {heading}
        <p>{t('users.account.passkeys.unsupported')}</p>
      </section>
    );
  }

  if (list.isError || status.isError) {
    return (
      <section>
        {heading}
        <Alert color="danger" fade={false} role="alert">
          {describeApiError(httpResponseMapper(list.error ?? status.error))}{' '}
          <Button
            color="link"
            size="sm"
            className="p-0 align-baseline"
            onClick={() => {
              void list.refetch();
              void status.refetch();
            }}
          >
            {t('common.error.tryAgain')}
          </Button>
        </Alert>
      </section>
    );
  }

  const passkeys = list.data;
  if (!passkeys || !status.data || supported === null) {
    return (
      <section>
        {heading}
        <p>{t('users.staffTools.loading')}</p>
      </section>
    );
  }

  return (
    <section>
      {heading}
      <p>{t('users.account.passkeys.intro')}</p>
      {passkeys.length > 0 ? (
        <ul className="list-unstyled" id="passkey-list">
          {passkeys.map((passkey) => (
            <PasskeyRow key={passkey.id} passkey={passkey} status={status.data} />
          ))}
        </ul>
      ) : (
        <p id="no-passkeys">{t('users.account.passkeys.none')}</p>
      )}
      {supported && (
        <form id="passkey-add" onSubmit={(e) => void add(e)}>
          <FormGroup>
            <Label for="passkey-name">{t('users.account.passkeys.name')}</Label>
            <Input
              id="passkey-name"
              name="name"
              maxLength={64}
              placeholder={t('users.account.passkeys.namePlaceholder')}
              style={{ maxWidth: '20rem' }}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </FormGroup>
          <IdentityProofField status={status.data} id="passkey-proof" value={proof} onChange={setProof} error={fieldError} />
          {failure && (
            <Alert color="danger" fade={false} role="alert">
              {failure}
            </Alert>
          )}
          <Button color="ui" id="passkey-register" disabled={busy}>
            <InlineIcon first loading={busy} icon="plus" />
            {t('users.account.passkeys.add')}
          </Button>
        </form>
      )}
    </section>
  );
};
