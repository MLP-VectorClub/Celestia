import { useEffect, useState } from 'react';

import { useAuth } from 'src/hooks/auth';
import { usePrefs } from 'src/hooks/prefs';

/**
 * Whether the visitor turned on the nutshell names mode (`cg_nutshell`), and the roll that picks the names this component shows. The roll only exists
 * once the page is in the browser: names are random, so the server (and the first render in the browser) show the real labels instead of something
 * that would not match
 */
export function useNutshellMode(): { enabled: boolean; roll: number | null } {
  const { signedIn } = useAuth();
  const enabled = Boolean(usePrefs(signedIn)?.cg_nutshell);
  const [roll, setRoll] = useState<number | null>(null);

  useEffect(() => {
    setRoll(enabled ? Math.random() : null);
  }, [enabled]);

  return { enabled, roll: enabled ? roll : null };
}
