import { playwright } from '@vitest/browser-playwright';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const browserTests = 'src/**/*.browser.test.{ts,tsx}';

export default defineConfig({
  resolve: {
    alias: {
      src: fileURLToPath(new URL('./src', import.meta.url)),
      modules: fileURLToPath(new URL('./src/scss/modules', import.meta.url)),
    },
  },
  // tsconfig.json keeps "jsx": "preserve" for Next.js, so compile JSX here instead
  oxc: {
    jsx: { runtime: 'automatic' },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.test.{ts,tsx}'],
          exclude: [browserTests],
        },
      },
      {
        extends: true,
        // Pre-bundle up front, otherwise Vite reloads the page mid-run when it discovers them
        optimizeDeps: {
          include: ['react', 'react-dom/client', 'react/jsx-dev-runtime', 'vitest-browser-react'],
        },
        // Next.js inlines these at build time, the browser project has no `process`
        define: {
          'process.env.NEXT_PUBLIC_FRONTEND_HOST': JSON.stringify('http://localhost:3000'),
          'process.env.NEXT_PUBLIC_BACKEND_HOST': JSON.stringify('http://localhost:8000'),
        },
        test: {
          name: 'browser',
          include: [browserTests],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/**/*.d.ts'],
      reporter: ['text-summary', 'html', 'lcov', 'json-summary'],
    },
  },
});
