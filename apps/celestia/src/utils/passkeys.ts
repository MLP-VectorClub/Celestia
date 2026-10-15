import {
  WebAuthnAbortService,
  browserSupportsWebAuthn,
  browserSupportsWebAuthnAutofill,
  startAuthentication,
  startRegistration,
} from '@simplewebauthn/browser';
import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/browser';

/**
 * Passkeys through the browser's WebAuthn API. Only one ceremony can be open at a time: starting one ends the one before it, which is how a click
 * on the passkey button takes over from the autofill request that waits behind the e-mail field (`manualCeremonies` tells that request not to start again
 * until the click is dealt with)
 */
let manualCeremonies = 0;

export const passkeysSupported = (): boolean => typeof window !== 'undefined' && browserSupportsWebAuthn();

export const passkeyAutofillSupported = (): Promise<boolean> =>
  typeof window === 'undefined' ? Promise.resolve(false) : browserSupportsWebAuthnAutofill();

/** Whether a manual ceremony is open, waited for by the autofill request */
export const manualCeremonyOpen = (): boolean => manualCeremonies > 0;

async function manual<T>(run: () => Promise<T>): Promise<T> {
  manualCeremonies++;
  try {
    return await run();
  } finally {
    manualCeremonies--;
  }
}

export const signInWithPasskeyOptions = (optionsJSON: PublicKeyCredentialRequestOptionsJSON): Promise<AuthenticationResponseJSON> =>
  manual(() => startAuthentication({ optionsJSON }));

/** The request that waits behind the e-mail field: the browser offers the passkeys in the field's dropdown and answers when one is picked */
export const signInWithPasskeyAutofill = (optionsJSON: PublicKeyCredentialRequestOptionsJSON): Promise<AuthenticationResponseJSON> =>
  startAuthentication({ optionsJSON, useBrowserAutofill: true });

export const registerPasskeyOptions = (optionsJSON: PublicKeyCredentialCreationOptionsJSON): Promise<RegistrationResponseJSON> =>
  manual(() => startRegistration({ optionsJSON }));

export const cancelPasskeyCeremony = (): void => WebAuthnAbortService.cancelCeremony();

/**
 * The visitor dismissed the browser's prompt, it timed out, or another ceremony took over. Nothing to report for these, unlike a passkey the API
 * rejected or a browser without support
 */
export const isCeremonyEnd = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) return false;
  const { name, code, cause } = error as { name?: string; code?: string; cause?: { name?: string } };
  return (
    name === 'NotAllowedError' ||
    name === 'AbortError' ||
    code === 'ERROR_CEREMONY_ABORTED' ||
    cause?.name === 'NotAllowedError' ||
    cause?.name === 'AbortError'
  );
};

/** The passkey is already saved on the device the visitor is adding it from */
export const isAlreadyRegistered = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && (error as { code?: string }).code === 'ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED';
