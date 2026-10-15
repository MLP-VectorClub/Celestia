/**
 * The sign-in popup tells the page that opened it when the sign-in is done.
 *
 * `window.opener` can't be used for this: the provider's own sign-in pages send `Cross-Origin-Opener-Policy`, which cuts the link between the two
 * windows, and the opener then sees `popup.closed === true` while the popup is still open. A BroadcastChannel is not affected by that, so the popup
 * posts the result there and the opener answers with an acknowledgement, which is when the popup closes itself. `window.opener.__authCallback`
 * stays as the fallback for browsers without BroadcastChannel.
 */
export const OAUTH_CHANNEL_NAME = 'mlpvc-oauth';

type OAuthChannelMessage = { type: 'result'; success: true } | { type: 'ack' };

declare global {
  interface Window {
    __authCallback?: () => void;
  }
}

const openChannel = (): BroadcastChannel | null =>
  typeof BroadcastChannel === 'function' ? new BroadcastChannel(OAUTH_CHANNEL_NAME) : null;

let stopListening: VoidFunction | null = null;

/**
 * Called by the page that opens the popup. Runs `onSuccess` once when the popup reports a finished sign-in (and acknowledges it so the popup can
 * close), a later call replaces the earlier listener. Returns a function that stops listening.
 */
export function listenForOAuthResult(onSuccess: VoidFunction): VoidFunction {
  stopListening?.();

  const channel = openChannel();
  let done = false;
  const handlers: { success: VoidFunction; stop: VoidFunction } = { success: () => undefined, stop: () => undefined };

  handlers.stop = () => {
    channel?.close();
    if (window.__authCallback === handlers.success) delete window.__authCallback;
    if (stopListening === handlers.stop) stopListening = null;
  };
  handlers.success = () => {
    if (done) return;
    done = true;
    channel?.postMessage({ type: 'ack' } satisfies OAuthChannelMessage);
    handlers.stop();
    onSuccess();
  };

  if (channel) {
    channel.onmessage = (e: MessageEvent<OAuthChannelMessage>) => {
      if (e.data?.type === 'result' && e.data.success) handlers.success();
    };
  }
  window.__authCallback = handlers.success;
  stopListening = handlers.stop;

  return handlers.stop;
}

/**
 * Called by the popup once the user is signed in. `onAcknowledged` runs when the opener has taken note and the popup can close itself. Returns a
 * function that stops waiting.
 */
export function reportOAuthSuccess(onAcknowledged: VoidFunction): VoidFunction {
  const channel = openChannel();
  if (channel) {
    channel.onmessage = (e: MessageEvent<OAuthChannelMessage>) => {
      if (e.data?.type !== 'ack') return;
      channel.close();
      onAcknowledged();
    };
    channel.postMessage({ type: 'result', success: true } satisfies OAuthChannelMessage);
    return () => channel.close();
  }

  try {
    window.opener?.__authCallback?.();
    onAcknowledged();
  } catch {
    /* the opener can't be reached */
  }
  return () => undefined;
}

/**
 * Linking a Discord account to a signed in user reuses the sign-in redirect (the provider only accepts the redirect address registered for sign-in),
 * so the popup's callback page can't tell the two apart from its address. The page that opens the popup leaves a note here, which the callback page
 * takes: it belongs to a user and is only good for a few minutes.
 */
const LINK_INTENT_KEY = 'mlpvc-oauth-link';
const LINK_INTENT_LIFETIME = 10 * 60 * 1000;

export function noteDiscordLinkIntent(userId: number, now = Date.now()) {
  try {
    localStorage.setItem(LINK_INTENT_KEY, JSON.stringify({ userId, at: now }));
  } catch {
    /* linking can't be told from signing in without storage, the callback page then treats it as a sign-in */
  }
}

/** The user the note was left for, or `null` when there is none or it is stale. The note is removed */
export function takeDiscordLinkIntent(now = Date.now()): number | null {
  try {
    const raw = localStorage.getItem(LINK_INTENT_KEY);
    localStorage.removeItem(LINK_INTENT_KEY);
    const note = raw ? (JSON.parse(raw) as { userId?: unknown; at?: unknown }) : null;
    if (typeof note?.userId !== 'number' || typeof note.at !== 'number' || now - note.at > LINK_INTENT_LIFETIME) return null;
    return note.userId;
  } catch {
    return null;
  }
}
