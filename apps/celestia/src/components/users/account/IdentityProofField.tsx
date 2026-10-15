import { useTranslations } from 'next-intl';
import { FC } from 'react';
import { FormGroup, Input, Label } from 'reactstrap';

import { IdentityProof, TwoFactorStatus } from 'src/types/auth';

/**
 * What changes to the sign-in methods ask for before they happen: the current password, or (an account without one that has an authenticator app) a
 * code of that app. An account with neither is only known by its signed in session and gets no field
 */
export const proofNeeded = (status: Pick<TwoFactorStatus, 'passwordSet' | 'enabled'>): 'password' | 'code' | null =>
  status.passwordSet ? 'password' : status.enabled ? 'code' : null;

export const proofOf = (status: Pick<TwoFactorStatus, 'passwordSet' | 'enabled'>, value: string): IdentityProof => {
  switch (proofNeeded(status)) {
    case 'password':
      return { currentPassword: value };
    case 'code':
      return { code: value };
    default:
      return {};
  }
};

export const IdentityProofField: FC<{
  status: Pick<TwoFactorStatus, 'passwordSet' | 'enabled'>;
  id: string;
  value: string;
  onChange: (value: string) => void;
  /** Message of the validation error on `currentPassword` or `code` */
  error?: string;
}> = ({ status, id, value, onChange, error }) => {
  const t = useTranslations();
  const needed = proofNeeded(status);
  if (!needed) return null;

  return (
    <FormGroup>
      <Label for={id}>{t(needed === 'password' ? 'users.account.proof.password' : 'users.account.proof.code')}</Label>
      <Input
        id={id}
        name={needed === 'password' ? 'currentPassword' : 'code'}
        type={needed === 'password' ? 'password' : 'text'}
        autoComplete={needed === 'password' ? 'current-password' : 'one-time-code'}
        required
        style={{ maxWidth: '20rem' }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        invalid={Boolean(error)}
      />
      {error && <div className="invalid-feedback d-block">{error}</div>}
    </FormGroup>
  );
};
