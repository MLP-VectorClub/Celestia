import { AxiosRequestConfig } from 'axios';
import { IncomingMessage } from 'http';
import { pick } from 'lodash';

import { APP_HOST } from 'src/config';

/**
 * The address of the visitor a server-side request is made for, as the reverse proxy in front of Next.js reports it (`X-Real-IP`, or the first address
 * of `X-Forwarded-For`). The API throttles by address, so without this every visitor would count as the Next.js server
 */
export const visitorAddress = (headers: IncomingMessage['headers'] | undefined): string | undefined => {
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)?.split(',')[0]?.trim();
  return first(headers?.['x-real-ip']) || first(headers?.['x-forwarded-for']) || undefined;
};

export class Service {
  protected request?: IncomingMessage;

  constructor(req?: IncomingMessage) {
    this.request = req;
  }

  protected getRequestOptions(): undefined | AxiosRequestConfig {
    if (this.request) {
      if (!this.request?.headers?.referer) {
        if (!this.request.headers) {
          this.request.headers = {};
        }
        this.request.headers.referer = APP_HOST;
      }
      const address = visitorAddress(this.request.headers);
      return {
        headers: {
          ...pick(this.request?.headers, ['authorization', 'referer', 'origin', 'cookie']),
          ...(address ? { 'x-forwarded-for': address } : {}),
        },
      };
    }
  }
}
