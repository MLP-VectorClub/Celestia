import Axios from 'axios';

import { GetShowRequest, GetShowResult } from '@went.tf/mlp-vectorclub-api-types';
import { Service } from 'src/services/service-class';
import { ENDPOINTS } from 'src/utils';

export class ShowService extends Service {
  static getIndex = (data: GetShowRequest) => Axios.get<GetShowResult>(ENDPOINTS.SHOW(data));
}
