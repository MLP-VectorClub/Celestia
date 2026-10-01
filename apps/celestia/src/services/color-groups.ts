import Axios from 'axios';

import {
  GetAppearancesIdColorGroupsOrderResult,
  GetColorGroupsIdResult,
  PostAppearancesIdTemplateResult,
  PostColorGroupsRequest,
  PutColorGroupsIdRequest,
} from '@mlp-vectorclub/api-types';

/** Responses of the write endpoints carry rendered HTML next to the ID, only the ID is used, the lists are refetched */
export type ColorGroupBody = Pick<PostColorGroupsRequest, 'label' | 'colors' | 'major' | 'reason'>;

export class ColorGroupService {
  static get = (id: number) => Axios.get<GetColorGroupsIdResult>(`/color-groups/${id}`);

  static create = (appearanceId: number, data: ColorGroupBody) =>
    Axios.post<{ id?: number | string }>('/color-groups', { appearanceId, ...data });

  static update = (id: number, data: Pick<PutColorGroupsIdRequest, 'label' | 'colors' | 'major' | 'reason'>) =>
    Axios.put<{ id?: number | string }>(`/color-groups/${id}`, data);

  static remove = (id: number) => Axios.delete<void>(`/color-groups/${id}`);

  static getOrder = (appearanceId: number) =>
    Axios.get<GetAppearancesIdColorGroupsOrderResult>(`/appearances/${appearanceId}/color-groups/order`);

  static setOrder = (appearanceId: number, cgs: number[]) => Axios.put<unknown>(`/appearances/${appearanceId}/color-groups/order`, { cgs });

  static applyTemplate = (appearanceId: number) => Axios.post<PostAppearancesIdTemplateResult>(`/appearances/${appearanceId}/template`);
}
