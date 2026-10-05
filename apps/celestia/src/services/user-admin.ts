import Axios from 'axios';

import { GetUsersIdPersonalGuidePointsResult, PutUsersIdRoleRequest, PutUsersIdRoleResult } from '@mlp-vectorclub/api-types';

/** Staff tools of the profile page. The API answers 200 `{alreadyIn: true}` for an unchanged role and 204 otherwise */
export class UserAdminService {
  static setRole = (id: number, value: PutUsersIdRoleRequest['value']) =>
    Axios.put<PutUsersIdRoleResult | undefined>(`/users/${id}/role`, { value });

  static getPoints = (id: number) => Axios.get<GetUsersIdPersonalGuidePointsResult>(`/users/${id}/personal-guide/points`);

  static grantPoints = (id: number, body: { amount: number; comment?: string }) =>
    Axios.post<void>(`/users/${id}/personal-guide/points`, body);

  static recalculateHistory = (id: number) => Axios.post<void>(`/users/${id}/personal-guide/point-history/recalculation`);

  /** Staff: forget the cached contribution counts of a profile */
  static purgeContributionsCache = (id: number) => Axios.delete<void>(`/users/${id}/contributions/cache`);
}
