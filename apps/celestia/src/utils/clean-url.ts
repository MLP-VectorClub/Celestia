/**
 * Link hygiene ported from Winterchilla: links pasted from chats, forums and DeviantArt often arrive with junk attached.
 * Steps, in order: trim, drop a trailing `…` (a truncated link) with everything after it or a trailing `<` (a link wrapped in
 * angle brackets), remove backslashes, remove everything that is not printable ASCII
 */
export function cleanUrlText(text: string): string {
  return text
    .trim()
    .replace(/(?:….*|<)$/u, '')
    .replace(/\\/g, '')
    .replace(/[^ -~]/g, '');
}

const safeDecode = (text: string): string => {
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
};

/**
 * The path (with query) a visitor should be sent to instead of `rawPathAndQuery`, or `null` when the URL is fine as it is. Only
 * cleaning triggers a redirect, merely encoded characters (like `%20`) do not. The result always stays on the same host
 */
export function getCleanRedirectPath(rawPathAndQuery: string): string | null {
  const decoded = safeDecode(rawPathAndQuery).trim();
  const cleaned = cleanUrlText(decoded);
  if (cleaned === decoded) return null;

  // A leading `//` would be read as another host
  return `/${cleaned.replace(/^\/+/, '')}`;
}
