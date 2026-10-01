import Axios from 'axios';

import { Service } from 'src/services/service-class';

/**
 * Plain authenticated GET of an API URL built by `ENDPOINTS`; forwards the visitor's cookies when given a server-side request
 */
export class ResourceService extends Service {
  get = <T>(url: string) => Axios.get<T>(url, this.getRequestOptions());
}
