import type { Secrets } from './secrets';

/** The `.git/config` of a deployment that cloned with a token in the address, the thing scanners look for in it */
export const gitConfig = (s: Secrets, siteName: string): string => {
  const repo =
    siteName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'website';
  return `[core]
\trepositoryformatversion = 0
\tfilemode = true
\tbare = false
\tlogallrefupdates = true
[remote "origin"]
\turl = https://deploy:${s.githubToken}@github.com/${repo}/${repo}.git
\tfetch = +refs/heads/*:refs/remotes/origin/*
[branch "main"]
\tremote = origin
\tmerge = refs/heads/main
[user]
\tname = deploy
\temail = deploy@${repo}.internal
`;
};
