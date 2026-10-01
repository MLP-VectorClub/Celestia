import Axios from 'axios';

import {
  GetAppearancesAutocompleteRequest,
  GetAppearancesAutocompleteResult,
  GetAppearancesFullRequest,
  GetAppearancesFullResult,
  GetAppearancesIdLocateRequest,
  GetAppearancesIdLocateResult,
  GetAppearancesIdRequest,
  GetAppearancesIdResult,
  GetAppearancesPinnedRequest,
  GetAppearancesPinnedResult,
  GetAppearancesRequest,
  GetColorGuideMajorChangesRequest,
  GetColorGuideMajorChangesResult,
  GetColorGuideResult,
} from '@mlp-vectorclub/api-types';
import { Service } from 'src/services/service-class';
import { PagedAppearancesResult } from 'src/types/api-alias';
import { ENDPOINTS } from 'src/utils';

export class ColorGuideService extends Service {
  getAppearance = (data: GetAppearancesIdRequest) =>
    Axios.get<GetAppearancesIdResult>(ENDPOINTS.APPEARANCE(data), this.getRequestOptions());

  getAppearances = (data: GetAppearancesRequest) =>
    Axios.get<PagedAppearancesResult>(ENDPOINTS.APPEARANCES(data), this.getRequestOptions());

  getIndexData = () => Axios.get<GetColorGuideResult>(ENDPOINTS.GUIDE_INDEX, this.getRequestOptions());

  getFullList = (data: GetAppearancesFullRequest) =>
    Axios.get<GetAppearancesFullResult>(ENDPOINTS.APPEARANCES_FULL(data), this.getRequestOptions());

  getPinnedAppearances = (data: GetAppearancesPinnedRequest) =>
    Axios.get<GetAppearancesPinnedResult>(ENDPOINTS.APPEARANCES_PINNED(data), this.getRequestOptions());

  getAutocompleteAppearances = (data: GetAppearancesAutocompleteRequest) =>
    Axios.get<GetAppearancesAutocompleteResult>(ENDPOINTS.APPEARANCES_AUTOCOMPLETE(data), this.getRequestOptions());

  getMajorChanges = (data: GetColorGuideMajorChangesRequest) =>
    Axios.get<GetColorGuideMajorChangesResult>(ENDPOINTS.GUIDE_MAJOR_CHANGES(data), this.getRequestOptions());

  getAppearanceLocation = (data: GetAppearancesIdLocateRequest) =>
    Axios.get<GetAppearancesIdLocateResult>(ENDPOINTS.APPEARANCE_LOCATE(data), this.getRequestOptions());
}
