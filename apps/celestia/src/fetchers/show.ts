import { GetShowRequest } from '@mlp-vectorclub/api-types';
import { ShowService } from 'src/services';
import { requestPromiseMapper } from 'src/utils';

export const showListFetcher = (params: GetShowRequest) => () => requestPromiseMapper(ShowService.getIndex(params));
