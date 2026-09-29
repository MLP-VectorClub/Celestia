import { describe, expect, it } from 'vitest';
import { Status } from 'src/types';
import { mapQueryStatus } from 'src/utils/react-query-utils';

describe('mapQueryStatus', () => {
  it('should treat a pending query that is not fetching as not started', () => {
    expect(mapQueryStatus('pending', 'idle')).toEqual(Status.INIT);
  });

  it('should treat a pending query that is fetching or paused as loading', () => {
    expect(mapQueryStatus('pending', 'fetching')).toEqual(Status.LOAD);
    expect(mapQueryStatus('pending', 'paused')).toEqual(Status.LOAD);
  });

  it('should map settled queries regardless of background fetches', () => {
    expect(mapQueryStatus('success', 'idle')).toEqual(Status.SUCCESS);
    expect(mapQueryStatus('success', 'fetching')).toEqual(Status.SUCCESS);
    expect(mapQueryStatus('error', 'idle')).toEqual(Status.FAILURE);
    expect(mapQueryStatus('error', 'fetching')).toEqual(Status.FAILURE);
  });
});
