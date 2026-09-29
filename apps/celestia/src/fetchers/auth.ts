import { UserService } from 'src/services';
import { requestPromiseMapper } from 'src/utils';

export const currentUserFetcher = () => requestPromiseMapper(UserService.getMe());
