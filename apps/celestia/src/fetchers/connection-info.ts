import { AboutService } from 'src/services';
import { requestPromiseMapper } from 'src/utils';

export const connectionFetcher = () => requestPromiseMapper(AboutService.getConnection());
