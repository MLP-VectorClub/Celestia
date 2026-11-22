import { useEffect } from 'react';

import { renewStatsOptOut } from 'src/utils/stats-opt-out';

/** Keeps a saved opt-out from expiring for someone who keeps visiting (see `renewStatsOptOut`) */
export function useRenewStatsOptOut() {
  useEffect(() => {
    renewStatsOptOut();
  }, []);
}
