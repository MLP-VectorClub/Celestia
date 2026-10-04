import { format } from 'date-fns';
import { describe, expect, it } from 'vitest';

import { utcClock } from 'src/utils/utc-clock';

describe('utcClock', () => {
  it('formats as the UTC clock of the moment, whatever the time zone of the process', () => {
    const moment = new Date('2010-10-10T02:30:15Z');
    expect(format(utcClock(moment), 'yyyy-MM-dd HH:mm:ss')).toBe('2010-10-10 02:30:15');
  });

  it('keeps the date and time at the edges of a day', () => {
    expect(format(utcClock(new Date('2019-12-31T23:59:59Z')), 'yyyy-MM-dd HH:mm:ss')).toBe('2019-12-31 23:59:59');
    expect(format(utcClock(new Date('2020-01-01T00:00:00Z')), 'yyyy-MM-dd HH:mm:ss')).toBe('2020-01-01 00:00:00');
  });
});
