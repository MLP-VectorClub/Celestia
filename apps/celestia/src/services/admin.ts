import Axios from 'axios';

import {
  GetAdminLogsIdResult,
  GetAdminLogsRequest,
  GetAdminLogsResult,
  GetNoticesRequest,
  GetNoticesResult,
  GetUsefulLinksResult,
  Pagination,
  PostNoticesRequest,
} from '@mlp-vectorclub/api-types';

export type SiteSettingKey = 'reservation_rules' | 'about_reservations' | 'dev_role_label';
export interface PcgAppearancesResult {
  appearances: Array<{ id: number; label: string; ownerId: number; private: boolean; createdAt: string }>;
  pagination: Pagination;
}
export type NoticeBody = PostNoticesRequest;
export type UsefulLinkBody = { label: string; url: string; title?: string; minRole: string };

/** Staff-only site administration */
export class AdminService {
  static logs = (params: GetAdminLogsRequest) => Axios.get<GetAdminLogsResult>('/admin/logs', { params });

  /** Not in the contract of the old site, Luna's own endpoint */
  static pcgAppearances = (params: { page: number }) => Axios.get<PcgAppearancesResult>('/admin/pcg-appearances', { params });

  static logDetails = (id: number) => Axios.get<GetAdminLogsIdResult>(`/admin/logs/${id}`);

  static notices = (params: GetNoticesRequest) => Axios.get<GetNoticesResult>('/notices', { params });

  static createNotice = (body: NoticeBody) => Axios.post<unknown>('/notices', body);

  static updateNotice = (id: number, body: NoticeBody) => Axios.put<unknown>(`/notices/${id}`, body);

  static deleteNotice = (id: number) => Axios.delete<void>(`/notices/${id}`);

  static usefulLinks = () => Axios.get<GetUsefulLinksResult>('/useful-links');

  static createUsefulLink = (body: UsefulLinkBody) => Axios.post<unknown>('/useful-links', body);

  static updateUsefulLink = (id: number, body: UsefulLinkBody) => Axios.put<void>(`/useful-links/${id}`, body);

  static deleteUsefulLink = (id: number) => Axios.delete<void>(`/useful-links/${id}`);

  /** The API takes the new order as one comma separated string of IDs */
  static orderUsefulLinks = (ids: number[]) => Axios.put<void>('/useful-links/order', { list: ids.join(',') });

  static getSetting = (key: SiteSettingKey) => Axios.get<{ value: string }>(`/settings/${key}`);

  static setSetting = (key: SiteSettingKey, value: string) => Axios.put<unknown>(`/settings/${key}`, { value });

  /** Developer only: clears PHP's file status cache on the API server */
  static clearStatCache = () => Axios.delete<void>('/admin/stat-cache');

  /** Developer only: rebuilds the ElasticSearch index of the color guide */
  static reindexColorGuide = () => Axios.post<{ message: string }>('/color-guide/reindex');

  /** Developer only: the whole color guide as one JSON document */
  static exportColorGuide = () => Axios.get<Blob>('/color-guide/export', { responseType: 'blob' });
}
