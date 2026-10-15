import { GetAboutConnectionResult, GetAboutMembersResult } from '@went.tf/mlp-vectorclub-api-types';
import Axios from 'axios';

import { Service } from 'src/services/service-class';
import { ENDPOINTS } from 'src/utils';

export class AboutService extends Service {
  static getConnection = () => Axios.get<GetAboutConnectionResult>(ENDPOINTS.CONNECTION_INFO);

  static getMembers = () => Axios.get<GetAboutMembersResult>(ENDPOINTS.MEMBERS);
}
