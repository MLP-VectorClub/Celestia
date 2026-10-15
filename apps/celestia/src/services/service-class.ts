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
      const address = visitorAddress(this.request.headers);
      return {
        headers: {
          // The API keeps the user agent and address of the visitor on their session (the list of sessions in their account), so a request made for them
          // has to carry theirs, not axios's
          ...pick(this.request.headers, ['authorization', 'cookie', 'user-agent']),
          // The API only accepts a session cookie from requests that come from the front end (Sanctum checks Referer, then Origin), and these do, whatever
          // site the visitor came from. Without a cookie there is no session to accept, and the API must not start one either: a request that looks like the
          // front end's makes it keep a session for the visitor, one row of the sessions table for every page of every guest rendered on the server
          ...(this.request.headers.cookie ? { referer: APP_HOST } : {}),
          ...(address ? { 'x-forwarded-for': address } : {}),
        },
      };
    }
  }
}
