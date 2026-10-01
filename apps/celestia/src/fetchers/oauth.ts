import { UserService } from 'src/services';
import { PostUsersOauthSigninProviderRequest } from 'src/types/auth';
import { requestPromiseMapper } from 'src/utils';

export const oauthRegistrationFetcher = (data: PostUsersOauthSigninProviderRequest) => () =>
  requestPromiseMapper(UserService.signInOauth(data));
