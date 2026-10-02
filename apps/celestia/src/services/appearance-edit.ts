import Axios from 'axios';

import {
  DeleteAppearancesIdPinResult,
  DeleteAppearancesIdSpriteResult,
  GetAppearancesIdCutieMarksResult,
  GetAppearancesIdMetadataResult,
  GetAppearancesIdTagsResult,
  PostAppearancesIdPinResult,
  PostAppearancesIdSanitizeSvgResult,
  PostAppearancesIdSpriteResult,
  PutAppearancesIdCutieMarksRequest,
  PutAppearancesIdRequest,
  PutAppearancesIdResult,
} from '@mlp-vectorclub/api-types';

export class AppearanceEditService {
  static getMetadata = (id: number) => Axios.get<GetAppearancesIdMetadataResult>(`/appearances/${id}/metadata`);

  /**
   * The API moves the appearance to a personal guide when `guide` is left out (reported to Winterchilla), so the current guide is always sent
   */
  static update = (id: number, data: Omit<PutAppearancesIdRequest, 'id'>) => Axios.put<PutAppearancesIdResult>(`/appearances/${id}`, data);

  static remove = (id: number) => Axios.delete<void>(`/appearances/${id}`);

  static pin = (id: number) => Axios.post<PostAppearancesIdPinResult>(`/appearances/${id}/pin`);

  static unpin = (id: number) => Axios.delete<DeleteAppearancesIdPinResult>(`/appearances/${id}/pin`);

  static getTags = (id: number) => Axios.get<GetAppearancesIdTagsResult>(`/appearances/${id}/tags`);

  static setTags = (id: number, tags: string, origTags: string) => Axios.put<void>(`/appearances/${id}/tags`, { tags, origTags });

  static uploadSprite = (id: number, file: File) => {
    const body = new FormData();
    body.append('sprite', file);
    return Axios.post<PostAppearancesIdSpriteResult>(`/appearances/${id}/sprite`, body);
  };

  static removeSprite = (id: number) => Axios.delete<DeleteAppearancesIdSpriteResult>(`/appearances/${id}/sprite`);

  static getCutieMarks = (id: number) => Axios.get<GetAppearancesIdCutieMarksResult>(`/appearances/${id}/cutie-marks`);

  static setCutieMarks = (id: number, cutieMarks: PutAppearancesIdCutieMarksRequest['cutieMarks']) =>
    Axios.put<void>(`/appearances/${id}/cutie-marks`, { cutieMarks });

  /** Sanitizes an uploaded SVG, the returned `svgdata` is what `setCutieMarks` expects for a new or replaced file */
  static sanitizeSvg = (id: number, file: File) => {
    const body = new FormData();
    body.append('file', file);
    return Axios.post<PostAppearancesIdSanitizeSvgResult>(`/appearances/${id}/sanitize-svg`, body);
  };
}
