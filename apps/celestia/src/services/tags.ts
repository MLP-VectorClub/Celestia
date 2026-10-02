import Axios from 'axios';

import { PostTagsRequest, PutTagsIdRequest, PutTagsIdSynonymRequest } from '@mlp-vectorclub/api-types';

export type TagBody = Pick<PostTagsRequest, 'name' | 'type' | 'title'>;

/** Staff-only tag management. Flags are sent as 1 because Winterchilla used to read JSON `false` as truthy */
export class TagService {
  static create = (body: TagBody) => Axios.post<unknown>('/tags', body);

  static update = (id: number, body: Omit<PutTagsIdRequest, 'id'>) => Axios.put<unknown>(`/tags/${id}`, body);

  /** An in-use tag is only deleted when `sanityCheck` confirms it */
  static remove = (id: number, confirmed: boolean) =>
    Axios.delete<void>(`/tags/${id}`, { params: confirmed ? { sanityCheck: 1 } : undefined });

  static makeSynonym = (id: number, targetId: PutTagsIdSynonymRequest['targetId']) =>
    Axios.put<unknown>(`/tags/${id}/synonym`, { targetId });

  static removeSynonym = (id: number, keepTagged: boolean) =>
    Axios.delete<unknown>(`/tags/${id}/synonym`, { params: keepTagged ? { keepTagged: 1 } : undefined });

  static recountUses = (tagIds: number[]) => Axios.post<unknown>('/tags/recount-uses', { tagIds });
}
