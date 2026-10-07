const { NEXT_PUBLIC_CDN_DOMAIN, NEXT_PUBLIC_BACKEND_HOST, NEXT_PUBLIC_API_PREFIX } = process.env;
const { execFileSync } = require('child_process');
const vercelConfig = require('./vercel.json');

const devMode = process.env.NODE_ENV === 'development';

/** `<short commit>;<commit time>`. Deploys pass the deployed commit explicitly (see deploy.conf): the deploy worktree isn't the git repo, so asking git from here could describe some other checkout */
const makeBuildId = () => {
  if (process.env.BUILD_GIT_INFO) {
    console.log(`Using build ID from BUILD_GIT_INFO: ${process.env.BUILD_GIT_INFO}`);
    return process.env.BUILD_GIT_INFO;
  }
  try {
    const buildId = execFileSync('git', ['log', '-1', '--pretty=%h;%ct']).toString().trim();
    console.log(`Generated build ID: ${buildId}`);
    return buildId;
  } catch (e) {
    const buildId = `;${Math.floor(Date.now())}`;
    console.log(`Failed to generate build id, falling back to dummy value: ${buildId}`);
    console.error(e);
    return buildId;
  }
};
const BUILD_ID = makeBuildId();
const COMMIT = BUILD_ID.split(';')[0];
// Only for a real commit: the dummy build ID has none, and then there is no deployment to tell apart
const DEPLOYMENT_ID = /^[a-f0-9]{4,}$/i.test(COMMIT) ? COMMIT : undefined;

/** @type {import('next').NextConfig} */
module.exports = {
  // A separate build directory lets a server that is running (the browser test instance) keep its build while another one is made
  distDir: process.env.NEXT_DIST_DIR || '.next',
  reactStrictMode: true,
  transpilePackages: ['@mlp-vectorclub/ui'],
  i18n: {
    locales: ['en'],
    defaultLocale: 'en',
  },
  generateBuildId: async () => BUILD_ID,
  // Next.js 16.2+ notices an old page talking to a new deployment (and the other way round) by this id, and then loads the page again instead of failing
  // on a script that no longer exists. With a deployment ID the build ID is constant, so the commit and its time that the footer shows come from
  // NEXT_PUBLIC_BUILD_ID, see src/utils/build-id-parser.ts
  deploymentId: DEPLOYMENT_ID,
  env: { NEXT_PUBLIC_BUILD_ID: BUILD_ID },
  images: {
    remotePatterns: [{ hostname: NEXT_PUBLIC_CDN_DOMAIN }, { hostname: 'a.deviantart.net' }],
  },
  sassOptions: {
    // Bootstrap 5.3's own SCSS still uses deprecated Sass features (fixed upstream in Bootstrap 6);
    // this only hides warnings from inside node_modules, ours are still reported
    quietDeps: true,
  },
  async headers() {
    return vercelConfig.headers.reduce((acc, entry) => {
      // Allow all scripts in development mode
      const config = devMode
        ? {
            ...entry,
            headers: entry.headers.map((headerConfig) => {
              if (/content-security-policy/i.test(headerConfig.key)) {
                const value = headerConfig.value
                  .replace(/script-src [^;]+(;|$)/, `script-src * 'unsafe-inline' 'unsafe-hashes' 'unsafe-eval'$1`)
                  .replace(/((?:img|default)-src [^;]+)(;|$)/g, `$1 ${NEXT_PUBLIC_CDN_DOMAIN}$2`);
                return {
                  ...headerConfig,
                  value,
                };
              }

              return headerConfig;
            }),
          }
        : entry;

      if (config.source === '/(.*)') {
        acc.push({
          ...config,
          source: '/:path*',
        });
        acc.push({
          ...config,
          source: '/',
        });
      } else {
        acc.push(config);
      }
      return acc;
    }, []);
  },
  async redirects() {
    return [
      ...vercelConfig.redirects,
      // URLs of the previous site
      { source: '/blending', destination: '/cg/blending', permanent: true },
      { source: '/blending-reverse', destination: '/cg/blending-reverse', permanent: true },
      { source: '/picker', destination: '/cg/picker', permanent: true },
      { source: '/users/:user/cg/slot-history', destination: '/users/:user/cg/point-history', permanent: false },
      { source: '/cg/preferred', destination: '/cg', permanent: false },
      { source: '/admin/useful-links', destination: '/admin/usefullinks', permanent: true },
      { source: '/logs', destination: '/admin/logs', permanent: true },
      // Page numbers in the path (`/cg/pony/2`, `/admin/logs/3`) are `?page=` here
      { source: '/logs/:page(\\d+)', destination: '/admin/logs?page=:page', permanent: true },
      { source: '/admin/logs/:page(\\d+)', destination: '/admin/logs?page=:page', permanent: true },
      { source: '/admin/pcg-appearances/:page(\\d+)', destination: '/admin/pcg-appearances?page=:page', permanent: true },
      { source: '/events/:page(\\d+)', destination: '/events?page=:page', permanent: true },
      { source: '/cg/tags', destination: '/cg/pony/tags', permanent: true },
      { source: '/cg/tags/:page(\\d+)', destination: '/cg/pony/tags?page=:page', permanent: true },
      { source: '/cg/:guide(pony|eqg)/tags/:page(\\d+)', destination: '/cg/:guide/tags?page=:page', permanent: true },
      { source: '/cg/:guide(pony|eqg)/changes/:page(\\d+)', destination: '/cg/:guide/changes?page=:page', permanent: true },
      { source: '/cg/:guide(pony|eqg)/:page(\\d+)', destination: '/cg/:guide?page=:page', permanent: true },
      { source: '/users/:user/cg/point-history/:page(\\d+)', destination: '/users/:user/cg/point-history?page=:page', permanent: true },
      { source: '/users/:user/cg/slot-history/:page(\\d+)', destination: '/users/:user/cg/point-history?page=:page', permanent: true },
      { source: '/docs', destination: `${NEXT_PUBLIC_BACKEND_HOST}/`, permanent: false },
      // Pages that have no counterpart here (browser recognition, websocket diagnostics, the old style guide) go to their section
      { source: '/browser/:id?', destination: '/about/connection', permanent: true },
      { source: '/about/browser/:id?', destination: '/about/connection', permanent: true },
      { source: '/admin/wsdiag', destination: '/admin', permanent: true },
      { source: '/components', destination: '/', permanent: true },
      { source: '/users/:user/cg/:page(\\d+)', destination: '/users/:user/cg?page=:page', permanent: true },
      // The old sign-in return addresses (the query with the code is kept)
      { source: '/da-auth/end', destination: '/oauth/deviantart', permanent: false },
      { source: '/da-auth/:path*', destination: '/', permanent: false },
      { source: '/discord-connect/end', destination: '/oauth/discord', permanent: false },
      { source: '/discord-connect/:path*', destination: '/', permanent: false },
    ];
  },
  async rewrites() {
    return [
      ...vercelConfig.rewrites.map((rewrite) =>
        rewrite.source === `${NEXT_PUBLIC_API_PREFIX}/:path*`
          ? {
              ...rewrite,
              destination: `${NEXT_PUBLIC_BACKEND_HOST}/:path*`,
            }
          : rewrite
      ),
      // URLs of the previous site that are served by pages or by the API
      { source: '/cg/picker/frame', destination: '/cg/picker' },
      { source: '/@:name/:rest(.+)', destination: '/u/:name?rest=:rest' },
      { source: '/@:name', destination: '/u/:name' },
      // The public color guide export of the old site (other tools read it from this address)
      { source: '/dist/mlpvc-colorguide.json', destination: `${NEXT_PUBLIC_BACKEND_HOST}/color-guide/export` },
      // The export files of an appearance, which the API serves from its palette and image routes
      { source: '/users/:user(\\d+)/cg/v/:id(\\d+).json', destination: `${NEXT_PUBLIC_BACKEND_HOST}/appearances/:id/palette?format=json` },
      { source: '/users/:user(\\d+)/cg/v/:id(\\d+).gpl', destination: `${NEXT_PUBLIC_BACKEND_HOST}/appearances/:id/palette?format=gpl` },
      { source: '/users/:user(\\d+)/cg/v/:id(\\d+).png', destination: `${NEXT_PUBLIC_BACKEND_HOST}/appearances/:id/image?type=palette&format=png` },
      { source: '/users/:user(\\d+)/cg/v/:id(\\d+)p.svg', destination: `${NEXT_PUBLIC_BACKEND_HOST}/appearances/:id/image?type=preview&format=svg` },
      { source: '/users/:user(\\d+)/cg/v/:id(\\d+)f.svg', destination: `${NEXT_PUBLIC_BACKEND_HOST}/appearances/:id/image?type=facing&format=svg` },
      { source: '/cg/:guide/v/:id(\\d+).json', destination: `${NEXT_PUBLIC_BACKEND_HOST}/appearances/:id/palette?format=json` },
      { source: '/cg/v/:id(\\d+).gpl', destination: `${NEXT_PUBLIC_BACKEND_HOST}/appearances/:id/palette?format=gpl` },
      { source: '/cg/v/:id(\\d+).png', destination: `${NEXT_PUBLIC_BACKEND_HOST}/appearances/:id/image?type=palette&format=png` },
      { source: '/cg/v/:id(\\d+)p.svg', destination: `${NEXT_PUBLIC_BACKEND_HOST}/appearances/:id/image?type=preview&format=svg` },
      { source: '/cg/v/:id(\\d+)f.svg', destination: `${NEXT_PUBLIC_BACKEND_HOST}/appearances/:id/image?type=facing&format=svg` },
      { source: '/cg/v/:id(\\d+).json', destination: `${NEXT_PUBLIC_BACKEND_HOST}/appearances/:id/palette?format=json` },
      { source: '/cg/:guide/v/:id(\\d+).gpl', destination: `${NEXT_PUBLIC_BACKEND_HOST}/appearances/:id/palette?format=gpl` },
      { source: '/cg/:guide/v/:id(\\d+).png', destination: `${NEXT_PUBLIC_BACKEND_HOST}/appearances/:id/image?type=palette&format=png` },
      { source: '/cg/:guide/v/:id(\\d+)p.svg', destination: `${NEXT_PUBLIC_BACKEND_HOST}/appearances/:id/image?type=preview&format=svg` },
      { source: '/cg/:guide/v/:id(\\d+)f.svg', destination: `${NEXT_PUBLIC_BACKEND_HOST}/appearances/:id/image?type=facing&format=svg` },
    ];
  },
};
