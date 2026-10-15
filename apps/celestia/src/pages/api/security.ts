import type { NextApiRequest, NextApiResponse } from 'next';

import { APP_HOST } from 'src/config';
import { HONEYPOT_TRAPS } from 'src/honeypot';

/** Where somebody who reports a trap as a vulnerability is sent: Rick Astley's "Never Gonna Give You Up" */
const NEVER_GONNA_GIVE_YOU_UP = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

const CONTACT = 'mailto:mail@went.tf';
const VALID_FOR_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * The security policy of the site (RFC 9116), served at /.well-known/security.txt and /security.txt (see the rewrites in next.config.js). The honeypot
 * paths are listed from the same traps that spring them, so the note cannot go out of date. `Expires` is always a year from now, there is nothing here
 * that would need a human to renew it
 */
export const buildSecurityTxt = (now = new Date()): string =>
  [
    `Contact: ${CONTACT}`,
    `Expires: ${new Date(now.getTime() + VALID_FOR_MS).toISOString()}`,
    'Preferred-Languages: en, hu',
    `Canonical: ${APP_HOST}/.well-known/security.txt`,
    '',
    '# Honeypots',
    '#',
    '# These paths are traps for scanners. There is nothing behind them, they are listed as disallowed in robots.txt, and whoever asks for one',
    '# is refused for good. Whatever they seem to hand out (credentials, keys, tokens, configuration, a login page) was generated for the occasion and',
    '# opens nothing, so there is nothing to report about it. In the paths, * is any one folder or file name and ** is anything at all.',
    '#',
    ...HONEYPOT_TRAPS.map(({ glob }) => `#   ${glob}`),
    '#',
    '# A security report about any of the paths above will be answered once, on receipt, by pointing the reporter to the hit single',
    '# "Never Gonna Give You Up" by Rick Astley:',
    `# ${NEVER_GONNA_GIVE_YOU_UP}`,
    '',
  ].join('\n');

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.status(200).send(buildSecurityTxt());
}
