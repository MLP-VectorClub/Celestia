/**
 * Paths that scanners ask for and nobody else has a reason to: the pages of software the site does not run, secrets people leave lying around.
 * A visitor whose session asks for one is refused from then on (see `proxy.ts`), and every one of them is listed as disallowed in robots.txt, so
 * only what ignores robots.txt ever ends up here.
 *
 * Globs: `*` is anything but a slash, `**` anything at all, and a folder written `**` between slashes can also be no folder at all (`/<**>/.env`
 * stands for `/.env` and `/a/b/.env`)
 */
export const HONEYPOT_GLOBS: readonly string[] = ['/.env', '/wp-admin', '/wp-admin/**', '/admin.php'];

const escapeRegex = (text: string) => text.replace(/[.+?^${}()|[\]\\]/g, '\\$&');

/** One glob as the source of a regular expression that matches a whole path (a trailing slash does not matter) */
const globToRegexSource = (glob: string): string => {
  const source = glob
    .split('/**/')
    .map((part) =>
      part
        .split('**')
        .map((chunk) => chunk.split('*').map(escapeRegex).join('[^/]*'))
        .join('.*')
    )
    .join('/(?:.*/)?');
  return `${source}/?`;
};

/** What goes after `Disallow:` in robots.txt for a glob: the same wildcards, prefix matching does the rest */
const globToRobots = (glob: string): string => glob.replace(/\*\*/g, '*');

/** The name Luna logs for a glob: lowercase letters, digits, dots, dashes (its route takes 1 to 40 of them) */
const globToName = (glob: string): string =>
  glob
    .replace(/\*\*?/g, 'any')
    .replace(/[^a-z0-9.]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 40) || 'trap';

/** A trap: the path glob and, optionally, which decoy answers whoever asks for it (see `decoys/`) instead of the plain refusal */
export interface TrapSpec {
  glob: string;
  decoy?: string;
}

export interface TrapMatch {
  /** What Luna logs the hit as */
  name: string;
  decoy?: string;
}

export interface CompiledHoneypots {
  /** The trap a path belongs to, `null` for any other path */
  match: (pathname: string) => TrapMatch | null;
  /** The `Disallow:` lines of robots.txt */
  robotsLines: string[];
}

/**
 * Turns the traps into a single regular expression, once: the alternatives are named groups, so one test finds out both whether the path is a trap
 * and which one
 */
export const compileHoneypots = (traps: readonly (string | TrapSpec)[]): CompiledHoneypots => {
  const specs: TrapSpec[] = traps.map((trap) => (typeof trap === 'string' ? { glob: trap } : trap));
  const matches: TrapMatch[] = specs.map(({ glob, decoy }) => ({ name: globToName(glob), ...(decoy ? { decoy } : {}) }));
  const regex = new RegExp(`^(?:${specs.map(({ glob }, i) => `(?<t${i}>${globToRegexSource(glob)})`).join('|')})$`, 'i');
  return {
    match: (pathname) => {
      const groups = regex.exec(pathname)?.groups;
      if (!groups) return null;
      const index = specs.findIndex((_, i) => groups[`t${i}`] !== undefined);
      return index === -1 ? null : matches[index];
    },
    robotsLines: specs.map(({ glob }) => `Disallow: ${globToRobots(glob)}`),
  };
};
