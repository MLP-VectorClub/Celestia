import {
  ApiKey,
  BrowserSession,
  GetNotificationsResult,
  PostUsersMeApiKeysRequest,
  PostUsersMeApiKeysResult,
  PostUsersMeSocketTokenResult,
} from '@went.tf/mlp-vectorclub-api-types';
import Axios from 'axios';

import { UserPrefs } from 'src/types/api-alias';
import {
  AccountPasskey,
  IdentityProof,
  PasskeyCreationOptionsResponse,
  PostUsersMePasskeysRequest,
  TwoFactorSetup,
  TwoFactorStatus,
} from 'src/types/auth';

/**
 * Flags are sent as 1/0: the API reads JSON `false` as the (truthy) string "false" at the moment (reported to Winterchilla)
 */
export class AccountService {
  static setPreference = <K extends keyof UserPrefs>(userId: number, key: K, value: UserPrefs[K]) =>
    Axios.put<{ value: unknown }>(`/users/${userId}/preferences/${key}`, { value: typeof value === 'boolean' ? Number(value) : value });

  /** Every preference of the user (themselves or, for staff, anyone), defaults where nothing was set */
  static getPreferences = (userId: number) => Axios.get<Partial<UserPrefs>>(`/users/${userId}/preferences`);

  static getNotifications = () => Axios.get<GetNotificationsResult>('/notifications');

  /** A one time token for one connection to the websocket server, ask again for every (re)connection */
  static getSocketToken = () => Axios.post<PostUsersMeSocketTokenResult>('/users/me/socket-token');

  static markNotificationRead = (id: number) => Axios.post<void>(`/notifications/${id}/read`);

  /** The sessions of somebody else, for staff (the own ones come from `getSessions`) */
  static getSessionsOf = (userId: number) => Axios.get<{ sessions: BrowserSession[] }>(`/users/${userId}/sessions`);

  static deleteSessionOf = (userId: number, sessionId: string) => Axios.delete<void>(`/users/${userId}/sessions/${sessionId}`);

  /** Ends every session and access token of a user */
  static deleteSessionsOf = (userId: number) => Axios.delete<void>(`/users/${userId}/sessions`);

  static signOutEverywhere = () => Axios.post<void>('/users/signout', new URLSearchParams({ everywhere: '1' }));

  static syncDiscord = (userId: number) => Axios.post<void>(`/users/${userId}/discord/sync`);

  /** Binds the Discord account behind an OAuth `code` to the signed in user (`GET /users/oauth/signin/discord` is the redirect that leads to it) */
  static linkDiscord = (userId: number, code: string) => Axios.post<void>(`/users/${userId}/discord`, { code });

  static unlinkDiscord = (userId: number) => Axios.delete<void>(`/users/${userId}/discord`);

  /**
   * Luna's endpoint (Winterchilla's contract marks it internal, so there is no generated type). `currentPassword` is required when the
   * account already has a password. Every access token of the user is deleted on success, the visitor has to sign in again
   */
  static changePassword = (body: { currentPassword?: string; newPassword: string }) =>
    Axios.post<{ message: string }>('/users/me/password', body);

  /** Luna's e-mail change request (internal in Winterchilla's contract, so no generated type). `currentPassword` is needed for your own account */
  static requestEmailChange = (userId: number, body: { newEmail?: string; resend?: boolean; currentPassword?: string }) =>
    Axios.post<{ message: string }>(`/users/${userId}/email-changes`, { ...body, ...(body.resend ? { resend: 1 } : {}) });

  /** The link in the verification mail carries `hash` and `action`; `verify` sets the address, `block` puts it on the do-not-send list */
  static verifyEmail = (hash: string, action: 'verify' | 'block') =>
    Axios.post<{ message: string }>('/users/email/verify', { hash, action });

  /** The browsers the visitor is signed in on (Luna's own endpoint) */
  static getSessions = () => Axios.get<{ sessions: BrowserSession[] }>('/users/sessions');

  static deleteSession = (id: string) => Axios.delete<void>(`/users/sessions/${id}`);

  static getTwoFactor = () => Axios.get<TwoFactorStatus>('/users/me/two-factor');

  /** Starts setting up an authenticator app: the secret to scan. Nothing is asked at sign-in until `confirmTwoFactor` */
  static startTwoFactor = (proof: IdentityProof) => Axios.post<TwoFactorSetup>('/users/me/two-factor', proof);

  /** Turns two-factor authentication on with a code of the app, the recovery codes are in the answer and never shown again */
  static confirmTwoFactor = (code: string) => Axios.post<{ recoveryCodes: string[] }>('/users/me/two-factor/confirm', { code });

  static regenerateRecoveryCodes = (proof: IdentityProof) =>
    Axios.post<{ recoveryCodes: string[] }>('/users/me/two-factor/recovery-codes', proof);

  /** Axios sends the body of a DELETE only in `data` */
  static disableTwoFactor = (proof: IdentityProof) => Axios.delete<void>('/users/me/two-factor', { data: proof });

  static getApiKeys = () => Axios.get<ApiKey[]>('/users/me/api-keys');

  static createApiKey = (data: PostUsersMeApiKeysRequest) => Axios.post<PostUsersMeApiKeysResult>('/users/me/api-keys', data);

  static rotateApiKey = (id: number, proof: IdentityProof) =>
    Axios.post<PostUsersMeApiKeysResult>(`/users/me/api-keys/${id}/rotate`, proof);

  static deleteApiKey = (id: number) => Axios.delete<void>(`/users/me/api-keys/${id}`);

  static getPasskeys = () => Axios.get<AccountPasskey[]>('/users/me/passkeys');

  static passkeyRegistrationOptions = (proof: IdentityProof) =>
    Axios.post<PasskeyCreationOptionsResponse>('/users/me/passkeys/options', proof);

  static registerPasskey = (data: PostUsersMePasskeysRequest) => Axios.post<AccountPasskey>('/users/me/passkeys', data);

  static renamePasskey = (id: number, name: string) => Axios.patch<AccountPasskey>(`/users/me/passkeys/${id}`, { name });

  static deletePasskey = (id: number, proof: IdentityProof) => Axios.delete<void>(`/users/me/passkeys/${id}`, { data: proof });
}
