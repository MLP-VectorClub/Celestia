import { useEffect, useState } from 'react';

import { describeApiError } from 'src/hooks/mutation';
import { UserService } from 'src/services/user';
import { useAppDispatch } from 'src/store';
import { signInPasskeyThunk } from 'src/store/thunks';
import { httpResponseMapper } from 'src/utils/common';
import {
  cancelPasskeyCeremony,
  isCeremonyEnd,
  manualCeremonyOpen,
  passkeyAutofillSupported,
  passkeysSupported,
  signInWithPasskeyAutofill,
} from 'src/utils/passkeys';

const MAX_ROUNDS = 10;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Passkeys in the dropdown of the e-mail field, like Google's sign in does: while `active`, the browser (or the visitor's password manager) offers the
 * saved passkeys when the field with `autocomplete="... webauthn"` is focused, and picking one signs in. The request ends when the visitor picks, or
 * the browser times it out (then a new one is asked for, up to a limit), or `active` turns false
 */
export function usePasskeyAutofill(active: boolean) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    void (async () => {
      if (!(await passkeyAutofillSupported())) return;

      for (let round = 0; round < MAX_ROUNDS && !cancelled; round++) {
        // A click on the passkey button owns the browser's one ceremony for now
        while (manualCeremonyOpen() && !cancelled) await sleep(300);
        if (cancelled) return;

        try {
          const { data } = await UserService.passkeyOptions();
          if (cancelled) return;
          const credential = await signInWithPasskeyAutofill(data.options);
          if (cancelled) return;
          const result = await dispatch(signInPasskeyThunk({ challenge: data.challenge, credential, remember: true }));
          if (signInPasskeyThunk.fulfilled.match(result)) return;
        } catch (e) {
          // Anything but the prompt ending is not worth a message here: the passkey button reports what goes wrong
          if (cancelled || !isCeremonyEnd(e)) return;
        }
        await sleep(1000);
      }
    })();

    return () => {
      cancelled = true;
      cancelPasskeyCeremony();
    };
  }, [active, dispatch]);
}

/**
 * What to tell the visitor about a passkey request that failed: nothing (null) when they only closed the browser's prompt, what the API said when it
 * refused, else the fallback (a browser that cannot do it, a security key that does not work ...)
 */
export const passkeyErrorMessage = (error: unknown, fallback: string): string | null => {
  if (isCeremonyEnd(error)) return null;
  if (typeof error === 'object' && error !== null && 'isAxiosError' in error) return describeApiError(httpResponseMapper(error));
  return fallback;
};

/**
 * Whether this browser can do passkeys, `null` until that is known: the server renders without knowing, so reading it while rendering would make the
 * first browser render differ from the server's HTML
 */
export function usePasskeysSupported(): boolean | null {
  const [supported, setSupported] = useState<boolean | null>(null);
  useEffect(() => setSupported(passkeysSupported()), []);
  return supported;
}
