import { canonicalPathRedirect } from 'src/utils/url';

describe('canonicalPathRedirect', () => {
  it('leaves a canonical address alone', () => {
    expect(canonicalPathRedirect('/event/1-Contest', '/event/1-Contest')).toBeNull();
    expect(canonicalPathRedirect('/event/1-Contest?page=2', '/event/1-Contest')).toBeNull();
  });

  it('adds the name to an address without it and keeps the query string', () => {
    expect(canonicalPathRedirect('/event/1', '/event/1-Contest')).toBe('/event/1-Contest');
    expect(canonicalPathRedirect('/cg/pony/v/5?token=abc', '/cg/pony/v/5-Pony')).toBe('/cg/pony/v/5-Pony?token=abc');
  });

  it('replaces an outdated name', () => {
    expect(canonicalPathRedirect('/cg/pony/v/5-Old-Name', '/cg/pony/v/5-New-Name')).toBe('/cg/pony/v/5-New-Name');
  });
});
