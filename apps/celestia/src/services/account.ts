import Axios from 'axios';

import { UserPrefs } from 'src/types/api-alias';

/**
 * Flags are sent as 1/0: the API reads JSON `false` as the (truthy) string "false" at the moment (reported to Winterchilla)
 */
export class AccountService {
  static setPreference = <K extends keyof UserPrefs>(userId: number, key: K, value: UserPrefs[K]) =>
    Axios.put<{ value: unknown }>(`/users/${userId}/preferences/${key}`, { value: typeof value === 'boolean' ? Number(value) : value });

  /** Every preference of the user (themselves or, for staff, anyone), defaults where nothing was set */
  static getPreferences = (userId: number) => Axios.get<Partial<UserPrefs>>(`/users/${userId}/preferences`);

  static signOutEverywhere = () => Axios.post<void>('/users/signout', new URLSearchParams({ everywhere: '1' }));

  static syncDiscord = (userId: number) => Axios.post<void>(`/users/${userId}/discord/sync`);

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
}
