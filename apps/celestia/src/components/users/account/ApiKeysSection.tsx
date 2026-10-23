import { useQuery } from '@tanstack/react-query';
import { ApiKey, PostUsersMeApiKeysRequest, PostUsersMeApiKeysResult } from '@went.tf/mlp-vectorclub-api-types';
import { useTranslations } from 'next-intl';
import { FC, FormEvent, useState } from 'react';
import { Alert, Button, FormGroup, Input, Label } from 'reactstrap';

import InlineIcon from 'src/components/shared/InlineIcon';
import TimeAgo from 'src/components/shared/TimeAgo';
import { useDialog } from 'src/components/shared/dialogs/DialogProvider';
import { IdentityProofField, proofNeeded, proofOf } from 'src/components/users/account/IdentityProofField';
import { TWO_FACTOR_KEY } from 'src/components/users/account/TwoFactorSection';
import { describeApiError, fieldErrors, useApiMutation, useAuth } from 'src/hooks';
import { AccountService } from 'src/services/account';
import { API_KEY_SCOPES, ApiKeyScope } from 'src/types/auth';
import { httpResponseMapper } from 'src/utils/common';

const API_KEYS_KEY = '/users/me/api-keys';
const EXPIRIES = [null, 30, 90, 365] as const;

/** The secret of a key that was just made, which is the only time it can be copied */
const NewSecret: FC<{ created: PostUsersMeApiKeysResult; onDismiss: () => void }> = ({ created, onDismiss }) => {
  const t = useTranslations();

  return (
    <Alert color="success" fade={false} id="api-key-secret">
      <strong>{t('users.account.apiKeys.secretTitle')}</strong> ({created.key.name})
      <p className="mb-2">{t('users.account.apiKeys.secretWarning')}</p>
      <code className="d-block text-break mb-2">{created.secret}</code>
      <div className="d-flex gap-2">
        <Button type="button" color="ui" size="sm" onClick={() => void navigator.clipboard?.writeText(created.secret)}>
          <InlineIcon first icon="clone" />
          {t('users.account.apiKeys.copy')}
        </Button>
        <Button type="button" color="link" size="sm" onClick={onDismiss}>
          {t('users.account.apiKeys.dismiss')}
        </Button>
      </div>
    </Alert>
  );
};

/** The API keys of the account, made and rotated here with the password, and what an MCP client needs to use them */
export const ApiKeysSection: FC = () => {
  const t = useTranslations();
  const { confirm } = useDialog();
  const { signedIn } = useAuth();
  const list = useQuery({
    queryKey: [API_KEYS_KEY],
    queryFn: () => AccountService.getApiKeys().then((r) => r.data),
    enabled: signedIn,
    refetchOnMount: 'always',
  });
  // Shared with the two-factor section: says whether changes are confirmed with the password
  const status = useQuery({
    queryKey: [TWO_FACTOR_KEY],
    queryFn: () => AccountService.getTwoFactor().then((r) => r.data),
    enabled: signedIn,
  });

  const [name, setName] = useState('');
  const [scopes, setScopes] = useState<ApiKeyScope[]>(['read']);
  const [expiry, setExpiry] = useState<(typeof EXPIRIES)[number]>(90);
  const [proof, setProof] = useState('');
  const [created, setCreated] = useState<PostUsersMeApiKeysResult | null>(null);
  const [rotating, setRotating] = useState<number | null>(null);
  const [rotateProof, setRotateProof] = useState('');
  const proofFor = (value: string) => (status.data ? proofOf(status.data, value) : {});

  const create = useApiMutation((data: PostUsersMeApiKeysRequest) => AccountService.createApiKey(data), {
    invalidate: [[API_KEYS_KEY]],
    onSuccess: (result) => {
      setCreated(result);
      setName('');
      setProof('');
    },
  });
  const rotate = useApiMutation((id: number) => AccountService.rotateApiKey(id, proofFor(rotateProof)), {
    invalidate: [[API_KEYS_KEY]],
    onSuccess: (result) => {
      setCreated(result);
      setRotating(null);
      setRotateProof('');
    },
  });
  const revoke = useApiMutation((id: number) => AccountService.deleteApiKey(id), { invalidate: [[API_KEYS_KEY]] });

  const heading = (
    <h3 id="api-keys">
      <InlineIcon first icon="key" />
      {t('users.account.sections.apiKeys')}
    </h3>
  );

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
  if (!list.data || !status.data) {
    return (
      <section>
        {heading}
        <p>{t('users.staffTools.loading')}</p>
      </section>
    );
  }

  const createErrors = fieldErrors(create.error);
  const rotateErrors = fieldErrors(rotate.error);
  const otherError = [create.error, rotate.error, revoke.error].find((e) => e && !Object.keys(fieldErrors(e)).length);
  const mcpUrl = `${typeof window === 'undefined' ? '' : window.location.origin}/api/mcp`;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (create.isPending || !scopes.length) return;
    create.mutate({ name: name.trim(), scopes, ...(expiry ? { expiresInDays: expiry } : {}), ...proofFor(proof) });
  };

  const row = (key: ApiKey) => (
    <li key={key.id} id={`api-key-${key.id}`} className="border rounded p-2 mb-2">
      <div className="d-flex flex-wrap gap-2 align-items-center">
        <InlineIcon icon="key" />
        <strong className="api-key-name">{key.name}</strong>
        <Button type="button" color="warning" size="sm" className="rotate" onClick={() => setRotating(rotating === key.id ? null : key.id)}>
          <InlineIcon first icon="sync" />
          {t('users.account.apiKeys.rotate')}
        </Button>
        <Button
          type="button"
          color="red"
          size="sm"
          className="revoke"
          disabled={revoke.isPending}
          onClick={async () => {
            if (
              await confirm({
                title: t('users.account.apiKeys.revokeTitle'),
                body: t('users.account.apiKeys.revokeBody', { name: key.name }),
                color: 'danger',
                confirmLabel: t('users.account.apiKeys.revoke'),
              })
            ) {
              revoke.mutate(key.id);
            }
          }}
        >
          <InlineIcon first icon="trash" />
          {t('users.account.apiKeys.revoke')}
        </Button>
      </div>
      <small className="d-block mt-1">{key.scopes.map((s) => t(`users.account.apiKeys.scopes.${s}`)).join(', ')}</small>
      <small className="d-block">
        {t('users.account.created')} <TimeAgo date={key.createdAt} />
        {' · '}
        {key.lastUsedAt ? (
          <>
            {t('users.account.lastUsed')} <TimeAgo date={key.lastUsedAt} />
          </>
        ) : (
          t('users.account.apiKeys.neverUsed')
        )}
        {' · '}
        {key.expiresAt ? (
          <>
            {t('users.account.apiKeys.expiresOn')} <TimeAgo date={key.expiresAt} />
          </>
        ) : (
          `${t('users.account.apiKeys.expiry')}: ${t('users.account.apiKeys.never')}`
        )}
      </small>
      {rotating === key.id && (
        <form
          className="mt-2"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            if (!rotate.isPending) rotate.mutate(key.id);
          }}
        >
          <p className="mb-2">{t('users.account.apiKeys.rotateBody', { name: key.name })}</p>
          <IdentityProofField
            status={status.data}
            id={`api-key-${key.id}-proof`}
            value={rotateProof}
            onChange={setRotateProof}
            error={rotateErrors.currentPassword ?? rotateErrors.code}
          />
          <Button
            color="warning"
            size="sm"
            className="confirm-rotate"
            disabled={rotate.isPending || (proofNeeded(status.data) !== null && !rotateProof)}
          >
            <InlineIcon first loading={rotate.isPending} icon="sync" />
            {t('users.account.apiKeys.rotate')}
          </Button>
        </form>
      )}
    </li>
  );

  return (
    <section>
      {heading}
      <p>{t('users.account.apiKeys.intro')}</p>
      {created && <NewSecret created={created} onDismiss={() => setCreated(null)} />}
      {list.data.length > 0 ? (
        <ul className="list-unstyled" id="api-key-list">
          {list.data.map(row)}
        </ul>
      ) : (
        <p id="no-api-keys">{t('users.account.apiKeys.none')}</p>
      )}
      <form id="api-key-add" onSubmit={submit}>
        <FormGroup>
          <Label for="api-key-name">{t('users.account.apiKeys.name')}</Label>
          <Input
            id="api-key-name"
            name="name"
            required
            maxLength={60}
            placeholder={t('users.account.apiKeys.namePlaceholder')}
            style={{ maxWidth: '20rem' }}
            value={name}
            onChange={(e) => setName(e.target.value)}
            invalid={Boolean(createErrors.name)}
          />
          {createErrors.name && <div className="invalid-feedback d-block">{createErrors.name}</div>}
        </FormGroup>
        <fieldset className="mb-3">
          <legend className="fs-6">{t('users.account.apiKeys.scopesLegend')}</legend>
          {API_KEY_SCOPES.map((scope) => (
            <FormGroup check key={scope}>
              <Input
                type="checkbox"
                id={`api-key-scope-${scope}`}
                checked={scopes.includes(scope)}
                onChange={(e) => setScopes(e.target.checked ? [...scopes, scope] : scopes.filter((s) => s !== scope))}
              />
              <Label check for={`api-key-scope-${scope}`}>
                {t(`users.account.apiKeys.scopes.${scope}`)}
              </Label>
            </FormGroup>
          ))}
          {createErrors.scopes && <div className="invalid-feedback d-block">{createErrors.scopes}</div>}
        </fieldset>
        <FormGroup>
          <Label for="api-key-expiry">{t('users.account.apiKeys.expiry')}</Label>
          <Input
            id="api-key-expiry"
            type="select"
            style={{ maxWidth: '12rem' }}
            value={expiry ?? ''}
            onChange={(e) => setExpiry(e.target.value ? (Number(e.target.value) as 30 | 90 | 365) : null)}
          >
            {EXPIRIES.map((days) => (
              <option key={days ?? 'never'} value={days ?? ''}>
                {days ? t('users.account.apiKeys.days', { count: days }) : t('users.account.apiKeys.never')}
              </option>
            ))}
          </Input>
        </FormGroup>
        <IdentityProofField
          status={status.data}
          id="api-key-proof"
          value={proof}
          onChange={setProof}
          error={createErrors.currentPassword ?? createErrors.code}
        />
        {otherError && (
          <Alert color="danger" fade={false} role="alert">
            {describeApiError(otherError)}
          </Alert>
        )}
        <Button color="ui" id="api-key-create" disabled={create.isPending || !name.trim() || !scopes.length}>
          <InlineIcon first loading={create.isPending} icon="plus" />
          {t('users.account.apiKeys.create')}
        </Button>
      </form>
      <h4 className="mt-4 fs-5">{t('users.account.apiKeys.mcpHeading')}</h4>
      <p>{t('users.account.apiKeys.mcpText')}</p>
      <p className="mb-1">
        <code className="text-break">{mcpUrl}</code>
      </p>
      <p>
        {t('users.account.apiKeys.mcpClaude')}:{' '}
        <code className="text-break">
          claude mcp add --transport http vectorclub {mcpUrl} --header &quot;Authorization: Bearer YOUR_KEY&quot;
        </code>
      </p>
    </section>
  );
};
