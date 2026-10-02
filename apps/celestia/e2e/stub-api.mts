/**
 * A stand-in for the API the e2e tests run the real Next.js app against: `GET /show` answers from a made-up list whose size and response times the
 * tests set through `POST /__control`, everything else a signed out visitor's page needs gets a fixed answer. Run it with Node directly, see
 * playwright.config.ts.
 */
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';

import { PAGE_SIZE, makeEpisodes, makeOthers } from './show-fixtures.ts';

const port = Number(process.env.STUB_API_PORT ?? 4010);
const fixture = (name: string) => JSON.parse(readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), 'utf8')) as unknown;

interface Delay {
  /** Which table the response is for */
  table: 'episodes' | 'others';
  page: number;
  ms: number;
}
interface Control {
  episodes: number;
  others: number;
  delays: Delay[];
}

let control: Control = { episodes: 0, others: 0, delays: [] };
let log: Array<{ table: 'episodes' | 'others'; page: number; types: string[]; order: string | null }> = [];
let unhandled: string[] = [];

const readBody = (req: import('node:http').IncomingMessage) =>
  new Promise<string>((resolve) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => resolve(body));
  });

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const send = (status: number, body?: unknown) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(body === undefined ? undefined : JSON.stringify(body));
  };

  if (req.method === 'POST' && url.pathname === '/__control') {
    control = { episodes: 0, others: 0, delays: [], ...(JSON.parse(await readBody(req)) as Partial<Control>) };
    log = [];
    unhandled = [];
    return send(204);
  }
  if (url.pathname === '/__log') return send(200, { log, unhandled });

  if (req.method === 'GET' && url.pathname === '/show') {
    const types = [...url.searchParams.getAll('types[]'), ...url.searchParams.getAll('types')];
    const page = Number(url.searchParams.get('page') ?? 1);
    if (!Number.isInteger(page) || page < 1)
      return send(422, { message: 'The page must be at least 1.', errors: { page: ['The page must be at least 1.'] } });
    const table = types.includes('episode') ? 'episodes' : 'others';
    log.push({ table, page, types, order: url.searchParams.get('order') });

    const matching = [...makeEpisodes(control.episodes), ...makeOthers(control.others)].filter((entry) => types.includes(entry.type));
    const result = {
      show: matching.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
      pagination: {
        currentPage: page,
        totalPages: Math.max(1, Math.ceil(matching.length / PAGE_SIZE)),
        totalItems: matching.length,
        itemsPerPage: PAGE_SIZE,
      },
    };
    const delay = control.delays.find((d) => d.table === table && d.page === page)?.ms ?? 0;
    if (delay) await sleep(delay);
    return send(200, result);
  }

  const fixed: Record<string, [number, unknown]> = {
    '/sanctum/csrf-cookie': [204, undefined],
    '/users/me': [401, { message: 'Unauthenticated.' }],
    '/user-prefs/me': [200, fixture('user-prefs')],
    '/about/connection': [
      200,
      { commitId: 'e2e', commitTime: '2026-01-01T00:00:00Z', ip: '127.0.0.1', proxiedIps: null, userAgent: 'e2e', deviceIdentifier: 'e2e' },
    ],
    '/notices/current': [200, []],
    '/useful-links/sidebar': [200, []],
    '/config': [200, fixture('config')],
    '/events': [200, { events: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 20 } }],
  };
  const answer = fixed[url.pathname];
  if (req.method === 'GET' && answer) return send(answer[0], answer[1]);

  unhandled.push(`${req.method} ${req.url}`);
  send(404, { message: 'Not handled by the e2e stub' });
}).listen(port, '127.0.0.1', () => process.stdout.write(`e2e stub API on http://127.0.0.1:${port}\n`));
