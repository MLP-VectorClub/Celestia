import { describe, expect, it } from 'vitest';

import { shouldOfferDiscordInvite } from 'src/utils/discord-invite';

describe('shouldOfferDiscordInvite', () => {
  it('invites guests', () => {
    expect(shouldOfferDiscordInvite({ signedIn: false })).toBe(true);
  });

  it('invites signed in users who are not known to be on the server', () => {
    expect(shouldOfferDiscordInvite({ signedIn: true })).toBe(true);
    expect(shouldOfferDiscordInvite({ signedIn: true, discordServerMember: false })).toBe(true);
  });

  it('does not invite users who are on the server already', () => {
    expect(shouldOfferDiscordInvite({ signedIn: true, discordServerMember: true })).toBe(false);
  });

  it('does not invite whoever hid the invitation', () => {
    expect(shouldOfferDiscordInvite({ signedIn: true }, { p_hidediscord: true })).toBe(false);
    expect(shouldOfferDiscordInvite({ signedIn: true, discordServerMember: false }, { p_hidediscord: true })).toBe(false);
  });

  it('keeps offering it while the preferences have not arrived or leave it on', () => {
    expect(shouldOfferDiscordInvite({ signedIn: true }, undefined)).toBe(true);
    expect(shouldOfferDiscordInvite({ signedIn: true }, { p_hidediscord: false })).toBe(true);
    expect(shouldOfferDiscordInvite({ signedIn: true }, { p_hidediscord: null })).toBe(true);
  });
});
