import { IncomingMessage } from 'http';

import { CoreService, defaultServices } from 'src/services';
import { requestPromiseMapper } from 'src/utils';

export const csrfFetcher = () => CoreService.initCsrf().then((r) => r.status === 204);

export const usefulLinksFetcher = (req?: IncomingMessage) => () => {
  const service = req ? new CoreService(req) : defaultServices.core;
  return requestPromiseMapper(service.getSidebarUsefulLinks());
};
