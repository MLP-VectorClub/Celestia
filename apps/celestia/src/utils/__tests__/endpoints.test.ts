import { describe, expect, it } from 'vitest';

import { ENDPOINTS } from 'src/utils/endpoints';

describe('ENDPOINTS', () => {
  it('builds an appearance address, with the share token of a private one only when there is one', () => {
    expect(ENDPOINTS.APPEARANCE({ id: 12 })).toBe('/appearances/12');
    expect(ENDPOINTS.APPEARANCE({ id: 12, token: undefined })).toBe('/appearances/12');
    expect(ENDPOINTS.APPEARANCE({ id: 12, token: 'a-b' })).toBe('/appearances/12?token=a-b');
  });

  it('gives each token its own query key', () => {
    expect(ENDPOINTS.APPEARANCE({ id: 12, token: 'a' })).not.toBe(ENDPOINTS.APPEARANCE({ id: 12, token: 'b' }));
  });

  it('builds event and show addresses', () => {
    expect(ENDPOINTS.EVENT({ id: 3 })).toBe('/events/3');
    expect(ENDPOINTS.EVENT_FINISHED_IMAGE({ id: 3 })).toBe('/events/3/finished-image');
    expect(ENDPOINTS.SHOW_BY_ID({ id: 9 })).toBe('/show/9');
    expect(ENDPOINTS.SHOW_ADJACENT({ id: 9 })).toBe('/show/9/adjacent');
    expect(ENDPOINTS.POST_LOCATION({ id: 4 })).toBe('/posts/4/location');
  });

  it('puts list filters in the query string', () => {
    expect(ENDPOINTS.EVENTS()).toBe('/events');
    expect(ENDPOINTS.EVENTS({ page: 2 } as never)).toBe('/events?page=2');
  });
});
