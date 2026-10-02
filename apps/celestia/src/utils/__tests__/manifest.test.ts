import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const publicDir = join(__dirname, '../../../public');
const manifest = JSON.parse(readFileSync(join(publicDir, 'manifest.json'), 'utf8'));

describe('web app manifest', () => {
  it('has what installing the site needs', () => {
    expect(manifest.name).toBeTruthy();
    expect(manifest.start_url).toBe('/');
    expect(manifest.display).toBe('standalone');
  });

  it('only points at icons that exist', () => {
    expect(manifest.icons.length).toBeGreaterThan(0);
    manifest.icons.forEach((icon: { src: string }) => expect(existsSync(join(publicDir, icon.src))).toBe(true));
  });
});
