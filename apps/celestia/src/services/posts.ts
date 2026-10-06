import Axios from 'axios';

import {
  DeletePostsIdFinishResult,
  DeletePostsIdReservationResult,
  GetPostsIdReloadResult,
  PostPostsCheckImageResult,
  PostPostsIdApprovalResult,
  PostPostsIdReservationRequest,
  PostPostsIdReservationResult,
  PostPostsRequest,
  PostPostsResult,
  PostShowIdVoteResult,
  PutPostsIdFinishRequest,
} from '@mlp-vectorclub/api-types';

export type CreatePostBody = PostPostsRequest;

/** `allowOverwriteReserver` is read by the controller but missing from the documented finish body (reported to Winterchilla) */
export class PostService {
  static create = (data: CreatePostBody) => Axios.post<PostPostsResult>('/posts', data);

  static checkImage = (imageUrl: string) => Axios.post<PostPostsCheckImageResult>('/posts/check-image', { imageUrl });

  static reserve = (id: number, data?: Omit<PostPostsIdReservationRequest, 'id'>) =>
    Axios.post<PostPostsIdReservationResult>(`/posts/${id}/reservation`, data);

  /** Checks the images of a post after one of them failed to load (may mark the post broken or replace a moved Derpibooru image) */
  static reload = (id: number) => Axios.get<GetPostsIdReloadResult>(`/posts/${id}/reload`);

  static unreserve = (id: number) => Axios.delete<DeletePostsIdReservationResult>(`/posts/${id}/reservation`);

  static finish = (id: number, data: Omit<PutPostsIdFinishRequest, 'id'> & { allowOverwriteReserver?: boolean }) =>
    Axios.put<void>(`/posts/${id}/finish`, data);

  static unfinish = (id: number, unbind = false) =>
    Axios.delete<DeletePostsIdFinishResult>(`/posts/${id}/finish`, { params: unbind ? { unbind: 1 } : undefined });

  static approve = (id: number) => Axios.post<PostPostsIdApprovalResult>(`/posts/${id}/approval`);

  static unapprove = (id: number) => Axios.delete<void>(`/posts/${id}/approval`);

  static deleteRequest = (id: number) => Axios.delete<void>(`/posts/requests/${id}`);

  /** Only fields that are sent and differ from the stored value change */
  static update = (id: number, data: { label?: string | null; type?: 'chr' | 'obj' | 'bg' }) => Axios.put<void>(`/posts/${id}`, data);

  static changeImage = (id: number, imageUrl: string) => Axios.put<unknown>(`/posts/${id}/image`, { imageUrl });

  static unbreak = (id: number) => Axios.post<unknown>(`/posts/${id}/unbreak`);

  /** Staff only: adds an already finished reservation for the deviation's author */
  static addReservation = (showId: number, deviation: string) => Axios.post<unknown>('/posts/reservations', { showId, deviation });

  static vote = (showId: number, vote: number) => Axios.post<PostShowIdVoteResult>(`/show/${showId}/vote`, { vote });
}
