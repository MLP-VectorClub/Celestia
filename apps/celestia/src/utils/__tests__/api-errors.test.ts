import { AxiosError } from 'axios';
import { describe, expect, it } from 'vitest';

import { describeApiError, fieldErrors } from 'src/hooks/mutation';
import { UnifiedErrorResponseTypes } from 'src/types';
import { httpResponseMapper } from 'src/utils/common';

const axiosError = (status: number, data: unknown) => Object.assign(new AxiosError('x'), { response: { status, data, headers: {} } });

describe('httpResponseMapper', () => {
  it('keeps the hints of a conflict next to its message', () => {
    expect(httpResponseMapper(axiosError(409, { message: 'Reserver differs', retry: true }))).toEqual({
      type: UnifiedErrorResponseTypes.MESSAGE_ONLY,
      message: 'Reserver differs',
      details: { retry: true },
    });
  });
});

describe('describeApiError / fieldErrors', () => {
  it('shows the first validation message and maps messages to fields', () => {
    const error = httpResponseMapper(
      axiosError(422, { message: 'The given data was invalid.', errors: { imageUrl: ['Unsupported provider'] } })
    );
    expect(describeApiError(error)).toBe('Unsupported provider');
    expect(fieldErrors(error)).toEqual({ imageUrl: 'Unsupported provider' });
  });

  it('shows plain messages and has no fields for other errors', () => {
    const error = httpResponseMapper(axiosError(409, { message: 'This post has not been reserved by anypony yet' }));
    expect(describeApiError(error)).toBe('This post has not been reserved by anypony yet');
    expect(fieldErrors(error)).toEqual({});
  });

  it('asks guests to sign in', () => {
    expect(describeApiError(httpResponseMapper(axiosError(401, { message: 'Unauthorized' })))).toMatch(/sign in/i);
  });
});
