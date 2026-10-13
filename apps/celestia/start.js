// What pm2 runs (see pm2.json): `next start` with its listen address taken from .env.
//
// `next start` reads PORT from the environment but takes the host only as a -H flag, which defaults to 0.0.0.0
// (every interface), so a HOST in .env never did anything and the production server answered on its port from
// outside nginx. This loads the .env files Next itself loads, then gives -H the value of HOST, loopback if unset.
const path = require('node:path');

const nextDir = path.dirname(require.resolve('next/package.json'));
const { loadEnvConfig } = require(require.resolve('@next/env', { paths: [nextDir] }));
loadEnvConfig(__dirname, false);

process.argv.splice(2, 0, 'start', '-H', process.env.HOST || '127.0.0.1');
require('next/dist/bin/next');
