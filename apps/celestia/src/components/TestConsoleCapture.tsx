import Head from 'next/head';
import { FC } from 'react';

// Runs before the app's own scripts and keeps what the app reports to the console where the browser tests can read it. Pest's browser plugin only records
// console.log, but the problems that matter (a missing translation, a hydration mismatch, a failed request the app logs) come as console.error/warn
const SCRIPT = `(function () {
  var errors = (window.__appConsoleErrors = window.__appConsoleErrors || []);
  var text = function (args) {
    return Array.prototype.map.call(args, function (a) { return a && a.message ? a.name + ': ' + a.message : String(a); }).join(' ');
  };
  ['error', 'warn'].forEach(function (level) {
    var original = console[level];
    console[level] = function () {
      errors.push(level + ': ' + text(arguments).slice(0, 300));
      return original.apply(console, arguments);
    };
  });
  window.addEventListener('unhandledrejection', function (e) { errors.push('unhandled rejection: ' + text([e.reason]).slice(0, 300)); });
})();`;

/** Only in the build the browser tests run against (`NEXT_PUBLIC_CAPTURE_CONSOLE=1`, see `scripts/serve-ui-test-instance.sh`), never in the real site */
export const TestConsoleCapture: FC = () =>
  process.env.NEXT_PUBLIC_CAPTURE_CONSOLE === '1' ? (
    <Head>
      <script id="test-console-capture" dangerouslySetInnerHTML={{ __html: SCRIPT }} />
    </Head>
  ) : null;
