import {
  GetUserPrefsMeRequest,
  GetUserPrefsMeResult,
  GetUsersDaUsernameRequest,
  GetUsersDaUsernameResult,
  GetUsersIdRequest,
  GetUsersIdResult,
  GetUsersMeResult,
  GetUsersResult,
  PostUsersSignoutResult,
} from '@went.tf/mlp-vectorclub-api-types';
import Axios from 'axios';

import { Service } from 'src/services/service-class';
import {
  GetUsersTokensResult,
  PasskeyRequestOptionsResponse,
  PostUsersResult,
  PostUsersSigninPasskeyRequest,
  PostUsersSigninResult,
  PostUsersSigninTwoFactorPasskeyRequest,
  PostUsersSigninTwoFactorRequest,
} from 'src/types/auth';
import {
  PostUsersOauthSigninProviderRequest,
  PostUsersOauthSigninProviderResult,
  PostUsersRequest,
  PostUsersSigninRequest,
} from 'src/types/auth';
import { ENDPOINTS } from 'src/utils';

export class UserService extends Service {
  static getMe = () => Axios.get<GetUsersMeResult>(ENDPOINTS.USERS_ME);

  static getById = (data: GetUsersIdRequest) => Axios.get<GetUsersIdResult>(ENDPOINTS.USERS_BY_ID(data));

  static getByDaName = (data: GetUsersDaUsernameRequest) => Axios.get<GetUsersDaUsernameResult>(ENDPOINTS.USERS_BY_USERNAME(data));

  static signIn = (data: PostUsersSigninRequest) => Axios.post<PostUsersSigninResult>(ENDPOINTS.USERS_SIGNIN, data);

  /** Answers the challenge of `signIn` with a code or a recovery code */
  static signInTwoFactor = (data: PostUsersSigninTwoFactorRequest) =>
    Axios.post<Record<string, unknown>>(ENDPOINTS.USERS_SIGNIN_TWO_FACTOR, data);

  static twoFactorPasskeyOptions = (challenge: string) =>
    Axios.post<PasskeyRequestOptionsResponse>(ENDPOINTS.USERS_SIGNIN_TWO_FACTOR_PASSKEY_OPTIONS, { challenge });

  static signInTwoFactorPasskey = (data: PostUsersSigninTwoFactorPasskeyRequest) =>
    Axios.post<Record<string, unknown>>(ENDPOINTS.USERS_SIGNIN_TWO_FACTOR_PASSKEY, data);

  /** Options for signing in with a passkey alone, they hold for ten minutes and need no session */
  static passkeyOptions = () => Axios.post<PasskeyRequestOptionsResponse>(ENDPOINTS.USERS_SIGNIN_PASSKEY_OPTIONS, null);

  static signInPasskey = (data: PostUsersSigninPasskeyRequest) => Axios.post<Record<string, unknown>>(ENDPOINTS.USERS_SIGNIN_PASSKEY, data);

  static signInOauth = (data: PostUsersOauthSigninProviderRequest) =>
    Axios.post<PostUsersOauthSigninProviderResult>(ENDPOINTS.USERS_OAUTH_SIGNIN_PROVIDER(data), data);

  static signOut = () => Axios.post<PostUsersSignoutResult>(ENDPOINTS.USERS_SIGNOUT, null);

  static register = (data: PostUsersRequest) => Axios.post<PostUsersResult>(ENDPOINTS.USERS, data);

  static getTokens = () => Axios.post<GetUsersTokensResult>(ENDPOINTS.USERS_TOKENS);

  getPrefs = (data?: GetUserPrefsMeRequest) => Axios.get<GetUserPrefsMeResult>(ENDPOINTS.USER_PREFS_ME(data), this.getRequestOptions());

  static getList = () => Axios.get<GetUsersResult>(ENDPOINTS.USERS);
}
