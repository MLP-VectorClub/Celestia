/**
 * The link the Share button hands out. A private appearance opens for anybody holding its share token, so the token goes into the link
 * (the API only tells it to the people who may edit the appearance, which are the ones that can share it; for everything else it is `null`)
 */
export const appearanceShareUrl = (shortUrl: string, token?: string | null): string =>
  token ? `${shortUrl}${shortUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}` : shortUrl;
