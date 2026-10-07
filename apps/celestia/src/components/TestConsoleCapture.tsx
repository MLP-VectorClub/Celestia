import Head from 'next/head';
import { FC } from 'react';

// Loads (before the app's own scripts, it is not deferred; the site's CSP does not allow inline scripts) a script that keeps what the app reports to the console where the browser tests can read it. Pest's browser plugin only records
// console.log, but the problems that matter (a missing translation, a hydration mismatch, a failed request the app logs) come as console.error/warn

/** Only in the build the browser tests run against (`NEXT_PUBLIC_CAPTURE_CONSOLE=1`, see `scripts/serve-ui-test-instance.sh`), never in the real site */
export const TestConsoleCapture: FC = () =>
  process.env.NEXT_PUBLIC_CAPTURE_CONSOLE === '1' ? (
    <Head>
      <script id="test-console-capture" src="/test-console-capture.js" />
    </Head>
  ) : null;
