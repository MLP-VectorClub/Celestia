import Axios from 'axios';

import {
  DeletePostsIdFinishResult,
  DeletePostsIdReservationResult,
  PostPostsCheckImageResult,
  PostPostsIdApprovalResult,
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

  static reserve = (id: number) => Axios.post<PostPostsIdReservationResult>(`/posts/${id}/reservation`);

  static unreserve = (id: number) => Axios.delete<DeletePostsIdReservationResult>(`/posts/${id}/reservation`);

  static finish = (id: number, data: Omit<PutPostsIdFinishRequest, 'id'> & { allowOverwriteReserver?: boolean }) =>
    Axios.put<void>(`/posts/${id}/finish`, data);

  static unfinish = (id: number, unbind = false) =>
    Axios.delete<DeletePostsIdFinishResult>(`/posts/${id}/finish`, { params: unbind ? { unbind: 1 } : undefined });

  static approve = (id: number) => Axios.post<PostPostsIdApprovalResult>(`/posts/${id}/approval`);

  static unapprove = (id: number) => Axios.delete<void>(`/posts/${id}/approval`);

  static deleteRequest = (id: number) => Axios.delete<void>(`/posts/requests/${id}`);

  static vote = (showId: number, vote: number) => Axios.post<PostShowIdVoteResult>(`/show/${showId}/vote`, { vote });
}
