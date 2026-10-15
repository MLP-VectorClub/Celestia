/**
 * The lines of a robots.txt for everybody: the site's own rules, then the traps (listed so that only what ignores robots.txt ever springs one). The
 * traps are lines like any other, with nothing to tell them apart: a comment about them would only be a hint
 */
export const buildRobotsTxt = ({ comment, rules, honeypotLines }: { comment?: string; rules: string[]; honeypotLines: string[] }): string =>
  [...(comment ? [`# ${comment}`] : []), 'User-agent: *', ...rules, ...honeypotLines, ''].join('\n');
