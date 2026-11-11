import type { NextApiRequest, NextApiResponse } from 'next';

/** Liveness/readiness probe for the container: 200 while the server answers. It does not ask Luna, so an API outage does not restart the front end */
export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ status: 'ok' });
}
