const { NEXT_PUBLIC_CDN_DOMAIN, NEXT_PUBLIC_BACKEND_HOST, NEXT_PUBLIC_API_PREFIX } = process.env;
const withPlugins = require('next-compose-plugins');
const withCamelCaseCSSModules = require('./utils/next-css-modules');
const withTM = require('next-transpile-modules')(['@mlp-vectorclub/ui']);
const { promisify } = require('util');
const execFile = promisify(require('child_process').execFile);
const vercelConfig = require('./vercel.json');

const devMode = process.env.NODE_ENV === 'development';

module.exports = withPlugins(
  [
    [withCamelCaseCSSModules],
    [
      withTM,
      {
        reactStrictMode: true,
      },
    ],
  ],
  {
    i18n: {
      locales: ['en'],
      defaultLocale: 'en',
    },
    generateBuildId: async () => {
      // Deploys pass the deployed commit explicitly (see deploy.conf): the deploy worktree isn't the
      // git repo, so asking git from here could describe some other checkout
      if (process.env.BUILD_GIT_INFO) {
        console.log(`Using build ID from BUILD_GIT_INFO: ${process.env.BUILD_GIT_INFO}`);
        return process.env.BUILD_GIT_INFO;
      }
      try {
        const { stdout } = await execFile('git', ['log', '-1', '--pretty=%h;%ct']);
        const buildId = stdout.trim();
        console.log(`Generated build ID: ${buildId}`);
        return buildId;
      } catch (e) {
        const buildId = `;${Math.floor(Date.now())}`;
        console.log(`Failed to generate build id, falling back to dummy value: ${buildId}`);
        console.error(e);
        return buildId;
      }
    },
    images: {
      domains: [NEXT_PUBLIC_CDN_DOMAIN, 'a.deviantart.net'],
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
      return vercelConfig.redirects;
    },
    async rewrites() {
      return vercelConfig.rewrites.map((rewrite) =>
        rewrite.source === `${NEXT_PUBLIC_API_PREFIX}/:path*`
          ? {
              ...rewrite,
              destination: `${NEXT_PUBLIC_BACKEND_HOST}/:path*`,
            }
          : rewrite
      );
    },
  }
);
