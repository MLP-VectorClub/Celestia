import { Status } from 'src/types';
import { FetchStatus, QueryStatus } from '@tanstack/react-query';
import { httpResponseMapper } from 'src/utils/common';
import { AxiosResponse } from 'axios';

export function mapQueryStatus(status: QueryStatus, fetchStatus: FetchStatus) {
  switch (status) {
    case 'pending':
      // A pending query that isn't fetching is disabled and hasn't started yet
      return fetchStatus === 'idle' ? Status.INIT : Status.LOAD;
    case 'success':
      return Status.SUCCESS;
    case 'error':
      return Status.FAILURE;
    default:
      throw new Error(`Unknown query status: ${String(status)}`);
  }
}

export function requestPromiseMapper<T>(promise: Promise<AxiosResponse<T>>) {
  return promise.then((r) => r.data).catch((res: unknown) => Promise.reject(httpResponseMapper(res)));
}
