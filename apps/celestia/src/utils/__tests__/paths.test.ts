import { describe, expect, it } from 'vitest';

import { PATHS } from 'src/paths';
import { parseUserIdParam } from 'src/utils/profile';

describe('PATHS.EPISODE', () => {
  it('addresses episodes by season and episode', () => {
    expect(PATHS.EPISODE({ id: 7, type: 'episode', season: 2, episode: 3, parts: 1, title: "Hearth's Warming" })).toBe('/episode/S2E3-Hearth-s-Warming');
  });

  it('addresses two-parters by their range', () => {
    expect(PATHS.EPISODE({ id: 7, type: 'episode', season: 1, episode: 1, parts: 2, title: 'Friendship Is Magic' })).toBe(
      '/episode/S1E1-2-Friendship-Is-Magic'
    );
  });

  it('addresses movies and specials by ID', () => {
    expect(PATHS.EPISODE({ id: 12, type: 'movie', season: null, episode: null, parts: null, title: 'The Movie' })).toBe('/movie/12-The-Movie');
    expect(PATHS.EPISODE({ id: 13, type: 'special', season: null, episode: null, parts: null, title: 'Spec' })).toBe('/special/13-Spec');
  });
});

describe('PATHS.APPEARANCE', () => {
  it('keeps personal guide appearances under their owner', () => {
    expect(PATHS.APPEARANCE({ id: 5, label: 'My Pony', guide: null, ownerId: 9 })).toBe('/users/9/cg/v/5-My-Pony');
    expect(PATHS.APPEARANCE({ id: 5, label: 'My Pony', guide: 'pony' })).toBe('/cg/pony/v/5-My-Pony');
  });
});

describe('parseUserIdParam', () => {
  it('reads the ID from the slug', () => {
    expect(parseUserIdParam('12-Some-User')).toBe(12);
    expect(parseUserIdParam('12')).toBe(12);
    expect(parseUserIdParam('@name')).toBeNull();
    expect(parseUserIdParam(undefined)).toBeNull();
  });
});
