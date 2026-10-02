import Axios from 'axios';

import { GetShowPrefillResult, PostShowRequest, PostShowResult, PutShowIdRequest } from '@mlp-vectorclub/api-types';

export type ShowBody = PostShowRequest;

/** Staff-only show management. `twoparter` is sent as 1/0 because Winterchilla used to read JSON `false` as truthy */
export class ShowAdminService {
  static prefill = () => Axios.get<GetShowPrefillResult>('/show/prefill');

  static create = (body: ShowBody) => Axios.post<PostShowResult>('/show', body);

  static update = (id: number, body: Omit<PutShowIdRequest, 'id'>) => Axios.put<void>(`/show/${id}`, body);

  static remove = (id: number) => Axios.delete<unknown>(`/show/${id}`);
}
