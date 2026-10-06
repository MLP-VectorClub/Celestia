// Pins the Luna commit whose committed OpenAPI document the types are built from (and the document's sha256).
// Usage: pnpm --filter @mlp-vectorclub/api-types lock [luna commit, a branch or a tag; default: the tip of main]
const { execFileSync } = require('child_process');
const fs = require('fs');

const { lockPath, sha256, sourceUrl } = require('./lock-source');

const repository = 'MLP-VectorClub/Luna';
const file = 'docs/openapi/api-docs.json';

(async function () {
  let ref = process.argv[2] || 'main';
  if (!/^[0-9a-f]{40}$/.test(ref)) {
    const out = execFileSync('git', ['ls-remote', `https://github.com/${repository}.git`, ref], { encoding: 'utf8' });
    const sha = out.split(/\s+/)[0];
    if (!/^[0-9a-f]{40}$/.test(sha)) throw new Error(`Could not resolve "${ref}" in ${repository}`);
    ref = sha;
  }

  const lock = { repository, ref, path: file };
  const response = await fetch(sourceUrl(lock));
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${sourceUrl(lock)}, is ${file} committed in ${ref}?`);
  lock.sha256 = sha256(await response.text());

  fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2) + '\n');
  console.log(`Pinned Luna ${ref} (sha256 ${lock.sha256})`);
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
