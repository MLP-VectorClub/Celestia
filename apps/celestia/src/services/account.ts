import Axios from 'axios';

import { UserPrefs } from 'src/types/api-alias';

/**
 * Flags are sent as 1/0: the API reads JSON `false` as the (truthy) string "false" at the moment (reported to Winterchilla)
 */
export class AccountService {
  static setPreference = <K extends keyof UserPrefs>(userId: number, key: K, value: UserPrefs[K]) =>
    Axios.put<{ value: unknown }>(`/users/${userId}/preferences/${key}`, { value: typeof value === 'boolean' ? Number(value) : value });

  static signOutEverywhere = () => Axios.post<void>('/users/signout', new URLSearchParams({ everywhere: '1' }));

  static syncDiscord = (userId: number) => Axios.post<void>(`/users/${userId}/discord/sync`);

  static unlinkDiscord = (userId: number) => Axios.delete<void>(`/users/${userId}/discord`);

  /**
   * Luna's endpoint (Winterchilla's contract marks it internal, so there is no generated type). `currentPassword` is required when the
   * account already has a password. Every access token of the user is deleted on success, the visitor has to sign in again
   */
  static changePassword = (body: { currentPassword?: string; newPassword: string }) =>
    Axios.post<{ message: string }>('/users/me/password', body);
}
