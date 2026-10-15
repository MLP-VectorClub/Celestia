import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/browser';
import { FC } from 'react';

import { InlineIconProps } from 'src/types/component-props';

export enum AuthModalSide {
  SIGN_IN,
  REGISTER,
  PASSWORD_RESET,
  /** The second step of signing in to an account with two-factor authentication */
  TWO_FACTOR,
}

export interface SocialProviderConfig {
  name: string;
  renderIcon: FC<Omit<InlineIconProps, 'icon'>>;
}

export enum OAuthErrorTypes {
  AccessDenied = 'access_denied',
  UnknownError = 'unknown_error',
  ServerError = 'server_error',
}

/**
 * Sign-in, registration and token endpoints belong to Luna and are not part of Winterchilla's contract,
 * so their types are written here instead of coming from `@went.tf/mlp-vectorclub-api-types`
 */
export type SocialProvider = 'deviantart' | 'discord';

export interface PostUsersSigninRequest {
  email: string;
  password: string;
  remember?: boolean;
}

export interface PostUsersOauthSigninProviderRequest {
  provider: SocialProvider;
  code?: string;
  state?: string;
}

export type PostUsersOauthSigninProviderResult = { user: import('@went.tf/mlp-vectorclub-api-types').User };
export type GetUsersOauthSigninProviderRequest = { provider: SocialProvider };
/** What the account can answer a sign-in challenge with: a code of the authenticator app, a recovery code or a passkey */
export type TwoFactorMethod = 'totp' | 'recovery' | 'passkey';

export interface TwoFactorChallenge {
  /** Sent back with the answer, expires after five minutes */
  challenge: string;
  methods: TwoFactorMethod[];
}

/** Luna answers 202 `{twoFactor}` instead of signing in when the password is right but the account has a second factor */
export interface TwoFactorRequired {
  twoFactor: TwoFactorChallenge;
}

export const isTwoFactorRequired = (data: unknown): data is TwoFactorRequired =>
  typeof data === 'object' && data !== null && 'twoFactor' in data && typeof (data as TwoFactorRequired).twoFactor?.challenge === 'string';

export type PostUsersSigninResult = Record<string, unknown> | TwoFactorRequired;

export interface PostUsersSigninTwoFactorRequest {
  challenge: string;
  /** Six digits of the authenticator app */
  code?: string;
  recoveryCode?: string;
}

export interface PasskeyOptionsResponse<T> {
  options: T;
  challenge: string;
}
export type PasskeyRequestOptionsResponse = PasskeyOptionsResponse<PublicKeyCredentialRequestOptionsJSON>;
export type PasskeyCreationOptionsResponse = PasskeyOptionsResponse<PublicKeyCredentialCreationOptionsJSON>;

export interface PostUsersSigninPasskeyRequest {
  challenge: string;
  credential: AuthenticationResponseJSON;
  remember?: boolean;
}

export interface PostUsersSigninTwoFactorPasskeyRequest {
  /** The one of the password step */
  challenge: string;
  /** The one of the passkey options */
  passkeyChallenge: string;
  credential: AuthenticationResponseJSON;
}

export interface TwoFactorStatus {
  enabled: boolean;
  recoveryCodesRemaining: number;
  /** Changes are confirmed with the password when there is one, else with a code of the app (or nothing) */
  passwordSet: boolean;
}

export interface TwoFactorSetup {
  secret: string;
  /** The `otpauth://` address a QR code holds */
  uri: string;
}

export interface AccountPasskey {
  id: number;
  name: string;
  createdAt: string;
  lastUsedAt: string | null;
}

/** The proof of who is asking that changes of the sign-in methods need: the password, or a code for accounts without one */
export interface IdentityProof {
  currentPassword?: string;
  code?: string;
}

export interface PostUsersMePasskeysRequest {
  challenge: string;
  credential: RegistrationResponseJSON;
  name?: string;
}
export type GetUsersTokensResult = Record<string, unknown>[];
