import { defineConfig, devices } from '@playwright/test';

const STUB_PORT = 4010;
const APP_PORT = 4011;
const STUB = `http://127.0.0.1:${STUB_PORT}`;
const APP = `http://127.0.0.1:${APP_PORT}`;

/**
 * End to end tests: Chromium against the real Next.js app (production build, so real server-side rendering and client routing) with a stub API
 * behind it, see e2e/stub-api.ts. Run with `pnpm test:e2e`. The build is slow, set E2E_REUSE=1 to keep using a server that is already running.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  // The stub API holds one data set at a time, so tests run one after another
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: { baseURL: APP, trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'node e2e/stub-api.mts',
      url: `${STUB}/__log`,
      reuseExistingServer: Boolean(process.env.E2E_REUSE),
      env: { STUB_API_PORT: String(STUB_PORT) },
    },
    {
      command: `pnpm exec next build && pnpm exec next start -H 127.0.0.1 -p ${APP_PORT}`,
      url: `${APP}/show`,
      reuseExistingServer: Boolean(process.env.E2E_REUSE),
      timeout: 300_000,
      env: {
        NEXT_PUBLIC_BACKEND_HOST: STUB,
        NEXT_PUBLIC_FRONTEND_HOST: APP,
        NEXT_PUBLIC_CDN_DOMAIN: '127.0.0.1',
        NEXT_PUBLIC_API_PREFIX: '/api',
      },
    },
  ],
});
