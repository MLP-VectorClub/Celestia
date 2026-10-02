import Axios from 'axios';

import {
  GetAdminLogsIdResult,
  GetAdminLogsRequest,
  GetAdminLogsResult,
  GetNoticesRequest,
  GetNoticesResult,
  GetUsefulLinksResult,
  PostNoticesRequest,
} from '@mlp-vectorclub/api-types';

export type SiteSettingKey = 'reservation_rules' | 'about_reservations' | 'dev_role_label';
export type NoticeBody = PostNoticesRequest;
export type UsefulLinkBody = { label: string; url: string; title?: string; minRole: string };

/** Staff-only site administration */
export class AdminService {
  static logs = (params: GetAdminLogsRequest) => Axios.get<GetAdminLogsResult>('/admin/logs', { params });

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
}
