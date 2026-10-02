import { describe, expect, it } from 'vitest';

import { cleanUrlText, getCleanRedirectPath } from 'src/utils/clean-url';

describe('cleanUrlText', () => {
  it('drops a truncated link tail after an ellipsis', () => {
    expect(cleanUrlText('/cg/pony/v/12-Some-Long-Na…rest')).toBe('/cg/pony/v/12-Some-Long-Na');
    expect(cleanUrlText('/show/1…')).toBe('/show/1');
  });

  it('drops a trailing angle bracket but not one in the middle', () => {
    expect(cleanUrlText('/events<')).toBe('/events');
    expect(cleanUrlText('/a<b')).toBe('/a<b');
  });

  it('removes backslashes and non printable ASCII', () => {
    expect(cleanUrlText('/cg\\/pony')).toBe('/cg/pony');
    expect(cleanUrlText('/a\u0000b\u007fc é')).toBe('/abc ');
  });

  it('trims the ends', () => {
    expect(cleanUrlText('  /show ')).toBe('/show');
  });
});

describe('getCleanRedirectPath', () => {
  it('leaves clean URLs alone, even with encoded characters', () => {
    expect(getCleanRedirectPath('/cg/pony?q=a%20b')).toBeNull();
    expect(getCleanRedirectPath('/users/5-Name')).toBeNull();
  });

  it('keeps malformed escapes as they are', () => {
    expect(getCleanRedirectPath('/a%E0%A4%A')).toBeNull();
  });

  it('cleans after decoding, so an encoded ellipsis counts', () => {
    expect(getCleanRedirectPath('/cg/pony/v/12-Some-Na%E2%80%A6more')).toBe('/cg/pony/v/12-Some-Na');
    expect(getCleanRedirectPath('/show/1%3C')).toBe('/show/1');
  });

  it('keeps the query when cleaning the path', () => {
    expect(getCleanRedirectPath('/cg\\/pony?page=2')).toBe('/cg/pony?page=2');
  });

  it('never produces a protocol relative URL', () => {
    expect(getCleanRedirectPath('/\\/example.com/x')).toBe('/example.com/x');
    expect(getCleanRedirectPath('//example.com/x\\')).toBe('/example.com/x');
  });
});
