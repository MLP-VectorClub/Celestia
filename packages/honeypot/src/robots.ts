/** The lines of a robots.txt for everybody: the site's own rules, then the traps (listed so that only what ignores robots.txt ever springs one) */
export const buildRobotsTxt = ({ comment, rules, honeypotLines }: { comment?: string; rules: string[]; honeypotLines: string[] }): string =>
  [
    ...(comment ? [`# ${comment}`] : []),
    'User-agent: *',
    ...rules,
    '# Traps: nobody who reads this has a reason to ask for these, whoever does is refused from then on',
    ...honeypotLines,
    '',
  ].join('\n');
