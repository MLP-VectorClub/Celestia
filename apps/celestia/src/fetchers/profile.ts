import { GetUsersDaUsernameRequest, GetUsersIdRequest } from '@mlp-vectorclub/api-types';
import { UserService } from 'src/services';
import { requestPromiseMapper } from 'src/utils';

export type FetchUserParams = GetUsersDaUsernameRequest | GetUsersIdRequest;

export const userFetcher = (params: FetchUserParams) => () => {
  if ('id' in params) return requestPromiseMapper(UserService.getById(params));

  if ('username' in params) return requestPromiseMapper(UserService.getByDaName(params));

  throw new Error(`${userFetcher.name}: Invalid params parameter: ${JSON.stringify(params, null, 2)}`);
};
