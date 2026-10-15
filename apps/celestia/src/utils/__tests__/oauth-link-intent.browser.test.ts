import { beforeEach, describe, expect, it } from 'vitest';

import { noteDiscordLinkIntent, takeDiscordLinkIntent } from 'src/utils/oauth-popup';

describe('Discord link note', () => {
  beforeEach(() => localStorage.clear());

  it('is handed over once', () => {
    noteDiscordLinkIntent(9001);
    expect(takeDiscordLinkIntent()).toBe(9001);
    expect(takeDiscordLinkIntent()).toBeNull();
  });

  it('expires after ten minutes', () => {
    noteDiscordLinkIntent(9001, 1_000);
    expect(takeDiscordLinkIntent(1_000 + 10 * 60 * 1000 + 1)).toBeNull();
    noteDiscordLinkIntent(9001, 1_000);
    expect(takeDiscordLinkIntent(1_000 + 10 * 60 * 1000)).toBe(9001);
  });

  it('ignores a note that is not ours', () => {
    localStorage.setItem('mlpvc-oauth-link', 'nonsense');
    expect(takeDiscordLinkIntent()).toBeNull();
    localStorage.setItem('mlpvc-oauth-link', JSON.stringify({ userId: '9001', at: Date.now() }));
    expect(takeDiscordLinkIntent()).toBeNull();
  });
});
