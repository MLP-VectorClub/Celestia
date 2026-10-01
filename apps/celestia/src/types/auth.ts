import { FC } from 'react';

import { InlineIconProps } from 'src/types/component-props';

export enum AuthModalSide {
  SIGN_IN,
  REGISTER,
  PASSWORD_RESET,
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
 * so their types are written here instead of coming from `@mlp-vectorclub/api-types`
 */
export type SocialProvider = 'deviantart' | 'discord';

export interface PostUsersSigninRequest {
  email: string;
  password: string;
  remember?: boolean;
}

export interface PostUsersRequest {
  name: string;
  email: string;
  password: string;
}

export interface PostUsersOauthSigninProviderRequest {
  provider: SocialProvider;
  code?: string;
  state?: string;
}

export type PostUsersOauthSigninProviderResult = { user: import('@mlp-vectorclub/api-types').User };
export type GetUsersOauthSigninProviderRequest = { provider: SocialProvider };
export type PostUsersSigninResult = Record<string, unknown>;
export type PostUsersResult = Record<string, unknown>;
export type GetUsersTokensResult = Record<string, unknown>[];
