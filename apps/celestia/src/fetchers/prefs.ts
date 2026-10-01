import { IncomingMessage } from 'http';

import { GetUserPrefsMeRequest } from '@mlp-vectorclub/api-types';
import { UserService, defaultServices } from 'src/services';
import { UserPrefs } from 'src/types/api-alias';
import { requestPromiseMapper } from 'src/utils';

export function prefsFetcher<K extends ReadonlyArray<keyof UserPrefs>>(
  data?: { keys: K },
  req?: IncomingMessage
): () => Promise<Pick<UserPrefs, K[number]>>;

export function prefsFetcher(data?: GetUserPrefsMeRequest, req?: IncomingMessage) {
  return () => {
    const service = req ? new UserService(req) : defaultServices.user;
    return requestPromiseMapper(service.getPrefs(data));
  };
}
