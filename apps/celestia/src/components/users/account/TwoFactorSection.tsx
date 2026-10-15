import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toDataURL } from 'qrcode';
import { FC, FormEvent, useEffect, useState } from 'react';
import { Alert, Button, FormGroup, Input, Label } from 'reactstrap';

import InlineIcon from 'src/components/shared/InlineIcon';
import { useDialog } from 'src/components/shared/dialogs/DialogProvider';
import { IdentityProofField, proofOf } from 'src/components/users/account/IdentityProofField';
import { describeApiError, fieldErrors, useApiMutation, useAuth } from 'src/hooks';
import { AccountService } from 'src/services/account';
import { TwoFactorSetup } from 'src/types/auth';
import { httpResponseMapper } from 'src/utils/common';

export const TWO_FACTOR_KEY = '/users/me/two-factor';

/** The recovery codes right after they were made: the only time they are shown, so they come with ways to keep them */
const RecoveryCodes: FC<{ codes: string[]; onDone: () => void }> = ({ codes, onDone }) => {
  const t = useTranslations();
  const [copied, setCopied] = useState(false);
  const text = codes.join('\n');

  return (
    <div id="recovery-codes">
      <Alert color="warning" fade={false}>
        {t('users.account.twoFactor.recoveryCodesWarning')}
      </Alert>
      <ul className="list-unstyled font-monospace" style={{ columnWidth: '10rem' }}>
        {codes.map((code) => (
          <li key={code}>
            <code>{code}</code>
          </li>
        ))}
      </ul>
      <div className="d-flex flex-wrap gap-2">
        <Button
          type="button"
          color="ui"
          id="copy-recovery-codes"
          onClick={() => {
            void navigator.clipboard.writeText(text).then(() => setCopied(true));
          }}
        >
          <InlineIcon first icon={copied ? 'check' : 'clone'} />
          {t(copied ? 'common.copied' : 'users.account.twoFactor.copyCodes')}
        </Button>
        <Button
          tag="a"
          color="ui"
          id="download-recovery-codes"
          href={`data:text/plain;charset=utf-8,${encodeURIComponent(`${text}\n`)}`}
          download="mlp-vector-club-recovery-codes.txt"
        >
          <InlineIcon first icon="download" />
          {t('users.account.twoFactor.downloadCodes')}
        </Button>
        <Button type="button" color="green" id="recovery-codes-saved" onClick={onDone}>
          <InlineIcon first icon="check" />
          {t('users.account.twoFactor.codesSaved')}
        </Button>
      </div>
    </div>
  );
};

/** The authenticator app of the account: turning it on (scan, prove, keep the recovery codes), new recovery codes and turning it off */
export const TwoFactorSection: FC = () => {
  const t = useTranslations();
  const { confirm } = useDialog();
  const { signedIn } = useAuth();
  const status = useQuery({
    queryKey: [TWO_FACTOR_KEY],
    queryFn: () => AccountService.getTwoFactor().then((r) => r.data),
    enabled: signedIn,
    refetchOnMount: 'always',
  });

  const [proof, setProof] = useState('');
  const [setup, setSetup] = useState<TwoFactorSetup | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [codes, setCodes] = useState<string[] | null>(null);

  useEffect(() => {
    let current = true;
    setQr(null);
    if (setup) {
      void toDataURL(setup.uri, { margin: 1, width: 192 }).then((url) => current && setQr(url));
    }
    return () => {
      current = false;
    };
  }, [setup]);

  const data = status.data;
  const proofFor = () => (data ? proofOf(data, proof) : {});

  const start = useApiMutation(() => AccountService.startTwoFactor(proofFor()), {
    onSuccess: (result) => {
      setSetup(result);
      setProof('');
    },
  });
  const finish = useApiMutation(() => AccountService.confirmTwoFactor(code.replace(/\s+/g, '')), {
    invalidate: [[TWO_FACTOR_KEY]],
    onSuccess: (result) => {
      setSetup(null);
      setCode('');
      setCodes(result.recoveryCodes);
    },
  });
  const regenerate = useApiMutation(() => AccountService.regenerateRecoveryCodes(proofFor()), {
    invalidate: [[TWO_FACTOR_KEY]],
    onSuccess: (result) => {
      setProof('');
      setCodes(result.recoveryCodes);
    },
  });
  const disable = useApiMutation(() => AccountService.disableTwoFactor(proofFor()), {
    invalidate: [[TWO_FACTOR_KEY]],
    onSuccess: () => setProof(''),
  });

  const errors = fieldErrors(start.error ?? regenerate.error ?? disable.error);
  const confirmErrors = fieldErrors(finish.error);
  const otherError = [start.error, finish.error, regenerate.error, disable.error].find((e) => e && !Object.keys(fieldErrors(e)).length);

  const heading = (
    <h3 id="two-factor">
      <InlineIcon first icon="shield-halved" />
      {t('users.account.twoFactor.heading')}
    </h3>
  );

  if (status.isError) {
    return (
      <section>
        {heading}
        <Alert color="danger" fade={false} role="alert">
          {describeApiError(httpResponseMapper(status.error))}{' '}
          <Button color="link" size="sm" className="p-0 align-baseline" onClick={() => void status.refetch()}>
            {t('common.error.tryAgain')}
          </Button>
        </Alert>
      </section>
    );
  }
  if (!data) {
    return (
      <section>
        {heading}
        <p>{t('users.staffTools.loading')}</p>
      </section>
    );
  }

  if (codes) {
    return (
      <section>
        {heading}
        <RecoveryCodes codes={codes} onDone={() => setCodes(null)} />
      </section>
    );
  }

  if (setup) {
    const onConfirm = (e: FormEvent) => {
      e.preventDefault();
      if (code.trim() && !finish.isPending) finish.mutate();
    };
    return (
      <section>
        {heading}
        <ol>
          <li>{t('users.account.twoFactor.step1')}</li>
          <li>{t('users.account.twoFactor.step2')}</li>
        </ol>
        <div className="d-flex flex-wrap gap-4 align-items-start mb-3">
          {qr && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} width={192} height={192} alt={t('users.account.twoFactor.qrAlt')} id="two-factor-qr" />
          )}
          <div>
            <p className="mb-1">{t('users.account.twoFactor.cannotScan')}</p>
            <code id="two-factor-secret" className="user-select-all text-break">
              {setup.secret}
            </code>
          </div>
        </div>
        <form onSubmit={onConfirm} id="two-factor-confirm">
          <FormGroup>
            <Label for="two-factor-setup-code">{t('users.account.twoFactor.codeLabel')}</Label>
            <Input
              id="two-factor-setup-code"
              name="code"
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={7}
              placeholder="123456"
              style={{ maxWidth: '12rem' }}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              invalid={Boolean(confirmErrors.code)}
            />
            {confirmErrors.code && <div className="invalid-feedback d-block">{confirmErrors.code}</div>}
          </FormGroup>
          {otherError && (
            <Alert color="danger" fade={false} role="alert">
              {describeApiError(otherError)}
            </Alert>
          )}
          <div className="d-flex gap-2">
            <Button color="green" disabled={finish.isPending || !code.trim()}>
              <InlineIcon first loading={finish.isPending} icon="check" />
              {t('users.account.twoFactor.turnOn')}
            </Button>
            <Button
              type="button"
              color="link"
              onClick={() => {
                setSetup(null);
                setCode('');
                finish.reset();
              }}
            >
              {t('common.actions.cancel')}
            </Button>
          </div>
        </form>
      </section>
    );
  }

  const submit = (action: () => void) => (e: FormEvent) => {
    e.preventDefault();
    action();
  };

  return (
    <section>
      {heading}
      {data.enabled ? (
        <>
          <p id="two-factor-status">{t('users.account.twoFactor.on', { count: data.recoveryCodesRemaining })}</p>
          <form id="two-factor-manage" onSubmit={(e) => e.preventDefault()}>
            <IdentityProofField
              status={data}
              id="two-factor-proof"
              value={proof}
              onChange={setProof}
              error={errors.currentPassword ?? errors.code}
            />
            {otherError && (
              <Alert color="danger" fade={false} role="alert">
                {describeApiError(otherError)}
              </Alert>
            )}
            <div className="d-flex flex-wrap gap-2">
              <Button
                color="ui"
                type="submit"
                id="new-recovery-codes"
                disabled={regenerate.isPending}
                onClick={submit(() => regenerate.mutate())}
              >
                <InlineIcon first loading={regenerate.isPending} icon="key" />
                {t('users.account.twoFactor.newCodes')}
              </Button>
              <Button
                color="red"
                type="button"
                id="two-factor-disable"
                disabled={disable.isPending}
                onClick={async () => {
                  if (
                    await confirm({
                      title: t('users.account.twoFactor.disableTitle'),
                      body: t('users.account.twoFactor.disableBody'),
                      color: 'danger',
                      confirmLabel: t('users.account.twoFactor.disable'),
                    })
                  ) {
                    disable.mutate();
                  }
                }}
              >
                <InlineIcon first loading={disable.isPending} icon="trash" />
                {t('users.account.twoFactor.disable')}
              </Button>
            </div>
          </form>
        </>
      ) : (
        <form id="two-factor-start" onSubmit={submit(() => start.mutate())}>
          <p>{t('users.account.twoFactor.intro')}</p>
          <IdentityProofField
            status={data}
            id="two-factor-proof"
            value={proof}
            onChange={setProof}
            error={errors.currentPassword ?? errors.code}
          />
          {otherError && (
            <Alert color="danger" fade={false} role="alert">
              {describeApiError(otherError)}
            </Alert>
          )}
          <Button color="ui" id="two-factor-enable" disabled={start.isPending}>
            <InlineIcon first loading={start.isPending} icon="shield-halved" />
            {t('users.account.twoFactor.setUp')}
          </Button>
        </form>
      )}
    </section>
  );
};
