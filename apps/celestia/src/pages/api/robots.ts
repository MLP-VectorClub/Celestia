import type { NextApiRequest, NextApiResponse } from 'next';

import { honeypot } from 'src/honeypot';

/** Served as /robots.txt (see the rewrite in next.config.js): the traps are listed from the same patterns that spring them */
const DOWNLOADS = ['png', 'svg', 'json', 'gpl'].flatMap((extension) =>
  ['/cg/v', '/cg/*/v'].flatMap((base) => [`Disallow: ${base}/*.${extension}$`, `Disallow: ${base}/*.${extension}?*$`])
);

const ROBOTS_TXT = honeypot.robotsTxt({
  comment: 'The generated files of the color guide are for downloading, not for the search results',
  rules: [
    ...DOWNLOADS,
    'Disallow: /cg/cutiemark/*.svg$',
    'Disallow: /cg/cutiemark/*.svg?*$',
    'Disallow: /admin',
    'Disallow: /users/reset-password',
  ],
});

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.status(200).send(ROBOTS_TXT);
}
