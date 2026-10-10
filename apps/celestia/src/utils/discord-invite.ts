/**
 * Whether the sidebar offers the Discord invitation. Like the old site it is left out for visitors who hid it (preference `p_hidediscord`) and
 * for signed in users known to be on the server already; guests and everybody else get it
 */
export const shouldOfferDiscordInvite = (
  visitor: { signedIn: boolean; discordServerMember?: boolean },
  prefs?: { p_hidediscord?: boolean | null }
): boolean => !prefs?.p_hidediscord && !(visitor.signedIn && visitor.discordServerMember === true);
