import { PostUsersOauthSigninProviderRequest } from '@mlp-vectorclub/api-types';
import { UserService } from 'src/services';
import { requestPromiseMapper } from 'src/utils';

export const oauthRegistrationFetcher = (data: PostUsersOauthSigninProviderRequest) => () =>
  requestPromiseMapper(UserService.signInOauth(data));
