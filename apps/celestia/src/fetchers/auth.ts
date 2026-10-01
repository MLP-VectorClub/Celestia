import { User } from '@mlp-vectorclub/api-types';
import { UserService } from 'src/services';
import { requestPromiseMapper } from 'src/utils';

/** The contract wraps the user (`{user, sessionUpdating}`), Luna used to send the user object itself */
export const currentUserFetcher = (): Promise<User> =>
  requestPromiseMapper(UserService.getMe()).then((data) => ('user' in data ? data.user : (data as unknown as User)));
