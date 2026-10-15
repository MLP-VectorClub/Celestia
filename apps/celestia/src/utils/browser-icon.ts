/** The browser icons (the ponies of the old site) by the file they are in `public/img/browser` */
const ICONS: [match: RegExp, file: string][] = [
  [/firefoxfocus/, 'firefoxfocus'],
  [/firefox/, 'firefox'],
  [/edge/, 'edge'],
  [/vivaldi/, 'vivaldi'],
  [/yandex/, 'yandexbrowser'],
  [/samsung/, 'samsunginternet'],
  [/maxthon/, 'maxthon'],
  [/silk/, 'silk'],
  [/opera/, 'opera'],
  [/internetexplorer|msie|^ie/, 'ie'],
  [/chrome|chromium/, 'chrome'],
  [/safari/, 'safari'],
];

/**
 * The address of the icon for a session's `device` ("Firefox on Linux", what the API makes of the user agent: the browser, then the system), `null`
 * for a browser there is no icon of. Only the browser part counts, matched on its letters
 */
export const getBrowserIcon = (device: string): string | null => {
  const browser = device
    .split(' on ')[0]
    .toLowerCase()
    .replace(/[^a-z]/g, '');
  const icon = ICONS.find(([match]) => match.test(browser));
  return icon ? `/img/browser/${icon[1]}.png` : null;
};
