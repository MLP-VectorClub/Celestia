import { describe, expect, it } from 'vitest';

import { getBrowserIcon } from 'src/utils/browser-icon';

describe('getBrowserIcon', () => {
  it.each([
    ['Firefox on Linux', 'firefox'],
    ['Firefox Mobile on Android', 'firefox'],
    ['Firefox Focus on Android', 'firefoxfocus'],
    ['Chrome on Windows', 'chrome'],
    ['Chromium on Linux', 'chrome'],
    ['Edge on Windows', 'edge'],
    ['Safari on macOS', 'safari'],
    ['Opera on Windows', 'opera'],
    ['Internet Explorer on Windows', 'ie'],
    ['Samsung Internet on Android', 'samsunginternet'],
    ['Vivaldi on Linux', 'vivaldi'],
    ['Yandex Browser on Windows', 'yandexbrowser'],
  ])('picks the icon of %s', (device, file) => {
    expect(getBrowserIcon(device)).toBe(`/img/browser/${file}.png`);
  });

  it('has none for a browser it does not know, or no device', () => {
    expect(getBrowserIcon('Unknown device')).toBeNull();
    expect(getBrowserIcon('Netscape on Windows')).toBeNull();
    expect(getBrowserIcon('')).toBeNull();
  });

  it('only looks at the browser, not the system it runs on', () => {
    expect(getBrowserIcon('Netscape on Firefox OS')).toBeNull();
  });
});
