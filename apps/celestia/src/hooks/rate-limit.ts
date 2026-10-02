import { useEffect, useState } from 'react';

import { Nullable, UnifiedErrorResponse, UnifiedErrorResponseTypes } from 'src/types';

/**
 * Whether the action should stay locked because the last attempt was rate limited. Unlocks by itself once the `Retry-After` time has
 * passed, an error without a usable wait time does not lock anything
 */
export function useRateLimitLock(error: Nullable<UnifiedErrorResponse>): boolean {
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (error?.type !== UnifiedErrorResponseTypes.RATE_LIMITED || !Number.isFinite(error.retryAfter) || error.retryAfter <= 0) {
      setLocked(false);
      return;
    }

    setLocked(true);
    const timeout = setTimeout(() => setLocked(false), error.retryAfter * 1e3);
    return () => clearTimeout(timeout);
  }, [error]);

  return locked;
}
