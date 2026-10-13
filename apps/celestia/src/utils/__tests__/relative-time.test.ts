import { describe, expect, it } from 'vitest';

import { relativeTime } from 'src/utils/relative-time';

const NOW = Date.UTC(2026, 9, 13, 12, 0, 0);
const ago = (seconds: number) => relativeTime(NOW - seconds * 1000, NOW);
const MIN = 60;
const HOUR = 3600;
const DAY = 86400;

describe('relativeTime (moment.js wording)', () => {
  it('says "a few seconds" for the first 44 seconds', () => {
    expect(ago(0)).toBe('a few seconds ago');
    expect(ago(44)).toBe('a few seconds ago');
  });

  it('goes through minutes', () => {
    expect(ago(45)).toBe('a minute ago');
    expect(ago(89)).toBe('a minute ago');
    expect(ago(90)).toBe('2 minutes ago');
    expect(ago(44 * MIN)).toBe('44 minutes ago');
  });

  it('goes through hours', () => {
    expect(ago(45 * MIN)).toBe('an hour ago');
    expect(ago(89 * MIN)).toBe('an hour ago');
    expect(ago(90 * MIN)).toBe('2 hours ago');
    expect(ago(21 * HOUR)).toBe('21 hours ago');
  });

  it('goes through days', () => {
    expect(ago(22 * HOUR)).toBe('a day ago');
    expect(ago(35 * HOUR)).toBe('a day ago');
    expect(ago(36 * HOUR)).toBe('2 days ago');
    expect(ago(25 * DAY)).toBe('25 days ago');
  });

  it('goes through months and years without "about", "almost" or "over"', () => {
    expect(ago(26 * DAY)).toBe('a month ago');
    expect(ago(45 * DAY)).toBe('a month ago');
    expect(ago(46 * DAY)).toBe('2 months ago');
    expect(ago(200 * DAY)).toBe('7 months ago');
    expect(ago(320 * DAY)).toBe('a year ago');
    expect(ago(547 * DAY)).toBe('a year ago');
    expect(ago(548 * DAY)).toBe('2 years ago');
    expect(ago(5.4 * 365.2425 * DAY)).toBe('5 years ago');
    expect(ago(5.6 * 365.2425 * DAY)).toBe('6 years ago');
  });

  it('words the future as "in ..."', () => {
    expect(relativeTime(NOW + 3 * HOUR * 1000, NOW)).toBe('in 3 hours');
    expect(relativeTime(NOW + 10 * 1000, NOW)).toBe('in a few seconds');
  });

  it('accepts dates and timestamps', () => {
    expect(relativeTime(new Date(NOW - 2 * HOUR * 1000), new Date(NOW))).toBe('2 hours ago');
  });
});
