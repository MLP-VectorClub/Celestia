import { GetUsefulLinksSidebarResult } from '@went.tf/mlp-vectorclub-api-types';
import Axios from 'axios';

import { Service } from 'src/services/service-class';
import { ENDPOINTS } from 'src/utils';

export class CoreService extends Service {
  static initCsrf = () => Axios.get<void>(ENDPOINTS.CSRF_INIT);

  getSidebarUsefulLinks = () => Axios.get<GetUsefulLinksSidebarResult>(ENDPOINTS.USEFUL_LINKS_SIDEBAR, this.getRequestOptions());
}
