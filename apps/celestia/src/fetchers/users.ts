import { AboutService, UserService } from 'src/services';
import { requestPromiseMapper } from 'src/utils';

export const membersFetcher = () => requestPromiseMapper(AboutService.getMembers());

export const usersFetcher = () => requestPromiseMapper(UserService.getList());
