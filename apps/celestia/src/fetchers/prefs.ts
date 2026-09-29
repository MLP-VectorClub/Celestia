import { IncomingMessage } from 'http';

import { GetUserPrefsMeRequest, UserPrefs } from '@mlp-vectorclub/api-types';
import { UserService, defaultServices } from 'src/services';
import { requestPromiseMapper } from 'src/utils';

export function prefsFetcher<K extends NonNullable<GetUserPrefsMeRequest['keys']>>(
  data?: { keys: K },
  req?: IncomingMessage
): () => Promise<Pick<UserPrefs, K[number]>>;

export function prefsFetcher(data?: GetUserPrefsMeRequest, req?: IncomingMessage) {
  return () => {
    const service = req ? new UserService(req) : defaultServices.user;
    return requestPromiseMapper(service.getPrefs(data));
  };
}
