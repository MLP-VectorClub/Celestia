import { IncomingMessage } from 'http';

import { GetUsersMeResult, User } from '@mlp-vectorclub/api-types';
import { UserService } from 'src/services';
import { ResourceService } from 'src/services/resource';
import { ENDPOINTS, requestPromiseMapper } from 'src/utils';

/** The contract wraps the user (`{user, sessionUpdating}`), Luna used to send the user object itself */
const unwrapUser = (data: GetUsersMeResult): User => ('user' in data ? data.user : (data as unknown as User));

export const currentUserFetcher = (): Promise<User> => requestPromiseMapper(UserService.getMe()).then(unwrapUser);

/**
 * The signed in user of a server-side request, `null` for visitors without credentials or with ones the API does not accept. Used to
 * render the page for the right visitor from the start instead of showing the signed out page until the browser asks
 */
export async function requestUserFetcher(req: IncomingMessage): Promise<User | null> {
  if (!req.headers?.cookie && !req.headers?.authorization) return null;
  try {
    return unwrapUser(await requestPromiseMapper(new ResourceService(req).get<GetUsersMeResult>(ENDPOINTS.USERS_ME)));
  } catch {
    return null;
  }
}
