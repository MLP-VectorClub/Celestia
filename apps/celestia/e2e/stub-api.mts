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
  /** `/users/me` answers with this user instead of 401 */
  signedIn: boolean;
  /** Votes per rating the episodes start with, the show's score is their average */
  votes: Record<string, number>;
  /** The rating the signed in visitor gave before, `null` for none */
  userVote: number | null;
  /** Every vote is answered with 409, as for somebody who already voted */
  alreadyVoted: boolean;
  /** The role of the signed in visitor */
  userRole: string;
  /** What `/useful-links/sidebar` lists for a signed in visitor (signed out visitors get nothing, as in the real API) */
  usefulLinks: Array<{ id: number; label: string; url: string; title: string | null; minRole: string }>;
  /** The signed in visitor's `cg_nutshell` preference */
  nutshell: boolean;
  /** The appearances of the pony guide, listed in this order */
  appearances: Array<{ id: number; label: string; nutshellNames: string[]; characterTags?: string[] }>;
  /** Whether episodes have aired (voting open) */
  aired: boolean;
  /** Requests whose path starts with this answer with the status instead (with `Retry-After` when given) */
  failures: Array<{ path: string; status: number; retryAfter?: number }>;
}

const DEFAULT_CONTROL: Control = {
  episodes: 0,
  others: 0,
  delays: [],
  signedIn: false,
  votes: {},
  userVote: null,
  alreadyVoted: false,
  aired: true,
  nutshell: false,
  appearances: [],
  userRole: 'user',
  usefulLinks: [],
  failures: [],
};
let control: Control = { ...DEFAULT_CONTROL, votes: {} };
let voteLog: number[] = [];
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
    control = { ...DEFAULT_CONTROL, votes: {}, ...(JSON.parse(await readBody(req)) as Partial<Control>) };
    log = [];
    voteLog = [];
    unhandled = [];
    return send(204);
  }
  if (url.pathname === '/__log') return send(200, { log, unhandled, voteLog });

  const failure = control.failures.find((f) => url.pathname.startsWith(f.path));
  if (failure) {
    res.writeHead(failure.status, {
      'Content-Type': 'application/json',
      ...(failure.retryAfter ? { 'Retry-After': String(failure.retryAfter) } : {}),
    });
    return res.end(JSON.stringify({ message: `Stub failure ${failure.status}` }));
  }

  if (req.method === 'GET' && url.pathname === '/show') {
    const types = [...url.searchParams.getAll('types[]'), ...url.searchParams.getAll('types')];
    const page = Number(url.searchParams.get('page') ?? 1);
    if (!Number.isInteger(page) || page < 1)
      return send(422, { message: 'The page must be at least 1.', errors: { page: ['The page must be at least 1.'] } });
    const table = types.includes('episode') ? 'episodes' : 'others';
    log.push({ table, page, types, order: url.searchParams.get('order') });

    const season = url.searchParams.get('season');
    const episode = url.searchParams.get('episode');
    const matching = [...makeEpisodes(control.episodes), ...makeOthers(control.others)]
      .filter((entry) => types.includes(entry.type))
      .filter((entry) => (season === null || entry.season === Number(season)) && (episode === null || entry.episode === Number(episode)));
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

  const score = () => {
    const entries = Object.entries(control.votes);
    const total = entries.reduce((sum, [, n]) => sum + n, 0);
    return total === 0 ? 0 : entries.reduce((sum, [rating, n]) => sum + Number(rating) * n, 0) / total;
  };
  const voteMatch = /^\/show\/(\d+)\/vote$/.exec(url.pathname);
  if (voteMatch && req.method === 'GET') return send(200, { data: control.votes });
  if (voteMatch && req.method === 'POST') {
    if (!control.signedIn) return send(401, { message: 'Unauthenticated.' });
    if (control.alreadyVoted) return send(409, { message: 'You have already voted on this episode' });
    const { vote } = JSON.parse(await readBody(req)) as { vote: number };
    voteLog.push(vote);
    control.votes[String(vote)] = (control.votes[String(vote)] ?? 0) + 1;
    control.userVote = vote;
    return send(200, { data: control.votes, userVote: vote });
  }
  const detailMatch = /^\/show\/(\d+)$/.exec(url.pathname);
  if (detailMatch && req.method === 'GET') {
    const entry = [...makeEpisodes(control.episodes), ...makeOthers(control.others)].find(
      (candidate) => candidate.id === Number(detailMatch[1])
    );
    if (!entry) return send(404, { message: 'Not found' });
    return send(200, {
      show: {
        ...entry,
        notes: null,
        score: score(),
        createdAt: entry.airs,
        updatedAt: null,
        postedBy: 1,
        aired: control.aired,
        willAir: entry.airs,
        userVote: control.signedIn ? control.userVote : null,
        canEdit: false,
        relatedAppearances: [],
      },
    });
  }
  if (req.method === 'GET' && url.pathname === '/posts') return send(200, { posts: [] });
  if (req.method === 'GET' && url.pathname === '/users/me' && control.signedIn) {
    return send(200, {
      user: { id: 9001, name: 'TestUser', role: control.userRole, avatarUrl: null, avatarProvider: 'deviantart' },
      sessionUpdating: false,
    });
  }

  const appearance = (a: Control['appearances'][number]) => ({
    id: a.id,
    label: a.label,
    ownerId: null,
    guide: 'pony',
    nutshellNames: a.nutshellNames,
    previewData: ['#ff0000', '#00ff00'],
    createdAt: '2020-01-01T00:00:00Z',
    notes: null,
    sprite: null,
    hasCutieMarks: false,
    tags: (a.characterTags ?? []).map((name, i) => ({ id: a.id * 10 + i, name, type: 'char' })),
  });
  if (req.method === 'GET' && url.pathname === '/appearances') {
    return send(200, {
      appearances: control.appearances.map((a) => ({ ...appearance(a), colorGroups: [] })),
      pagination: { currentPage: 1, totalPages: 1, totalItems: control.appearances.length, itemsPerPage: 7 },
    });
  }
  if (req.method === 'GET' && url.pathname === '/appearances/pinned') return send(200, []);
  if (req.method === 'GET' && url.pathname === '/appearances/full') {
    return send(200, {
      appearances: control.appearances.map(appearance),
      groups: [{ name: null, appearanceIds: control.appearances.map((a) => a.id) }],
    });
  }

  const fixed: Record<string, [number, unknown]> = {
    '/sanctum/csrf-cookie': [204, undefined],
    '/users/me': [401, { message: 'Unauthenticated.' }],
    '/user-prefs/me': [200, { ...(fixture('user-prefs') as object), cg_nutshell: control.nutshell }],
    '/about/connection': [
      200,
      { commitId: 'e2e', commitTime: '2026-01-01T00:00:00Z', ip: '127.0.0.1', proxiedIps: null, userAgent: 'e2e', deviceIdentifier: 'e2e' },
    ],
    '/notices/current': [200, []],
    '/useful-links/sidebar': [200, control.usefulLinks.filter((link) => control.signedIn || link.minRole === 'guest')],
    '/config': [200, fixture('config')],
    '/events': [200, { events: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0, itemsPerPage: 20 } }],
  };
  const answer = fixed[url.pathname];
  if (req.method === 'GET' && answer) return send(answer[0], answer[1]);

  unhandled.push(`${req.method} ${req.url}`);
  send(404, { message: 'Not handled by the e2e stub' });
}).listen(port, '127.0.0.1', () => process.stdout.write(`e2e stub API on http://127.0.0.1:${port}\n`));
