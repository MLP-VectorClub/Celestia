const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const lockPath = path.join(__dirname, '..', 'luna-api.lock');

const readLock = () => JSON.parse(fs.readFileSync(lockPath, 'utf8'));

const sourceUrl = ({ repository, ref, path: file }) => `https://raw.githubusercontent.com/${repository}/${ref}/${file}`;

const sha256 = (text) => crypto.createHash('sha256').update(text).digest('hex');

/** Downloads the OpenAPI document of the pinned Luna commit and checks it is the file the lock expects */
async function fetchLockedSchemaText() {
  const lock = readLock();
  const url = sourceUrl(lock);
  console.log(`Downloading the API schema of Luna ${lock.ref.slice(0, 10)} from ${url}…`);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  const text = await response.text();
  const actual = sha256(text);
  if (actual !== lock.sha256) {
    throw new Error(`The schema of Luna ${lock.ref} has sha256 ${actual}, the lock expects ${lock.sha256}. Run "pnpm --filter @mlp-vectorclub/api-types lock <luna commit>" to pin it again.`);
  }
  return text;
}

module.exports = { fetchLockedSchemaText, lockPath, readLock, sha256, sourceUrl };
