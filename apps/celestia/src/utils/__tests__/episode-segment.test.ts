import { describe, expect, it } from 'vitest';

import { parseEpisodeSegment } from 'src/utils/show-page';

describe('parseEpisodeSegment', () => {
  it('reads the season and episode', () => {
    expect(parseEpisodeSegment('S1E3')).toEqual({ season: 1, episodes: [3] });
    expect(parseEpisodeSegment('s01e03-Friendship-Is-Magic')).toEqual({ season: 1, episodes: [3] });
  });

  it('keeps the second number of the old two-part addresses as a fallback', () => {
    expect(parseEpisodeSegment('S9E25-26-The-Last-Problem')).toEqual({ season: 9, episodes: [25, 26] });
    expect(parseEpisodeSegment('S9E25-26')).toEqual({ season: 9, episodes: [25, 26] });
  });

  it('does not take a number inside the title for an episode', () => {
    expect(parseEpisodeSegment('S4E5-2nd-Try')).toEqual({ season: 4, episodes: [5] });
  });

  it('ignores everything else', () => {
    expect(parseEpisodeSegment('latest')).toBeNull();
    expect(parseEpisodeSegment('12-title')).toBeNull();
  });
});
