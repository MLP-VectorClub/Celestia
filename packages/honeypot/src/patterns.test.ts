import { describe, expect, it } from 'vitest';

import { compileHoneypots } from './patterns';

describe('compileHoneypots', () => {
  const traps = compileHoneypots(['/.env', '/wp-admin', '/wp-admin/**', '/admin.php']);

  it('matches the paths and what is under the folders, whatever the case or a trailing slash', () => {
    ['/.env', '/wp-admin', '/admin.php', '/wp-admin/install.php', '/WP-ADMIN/', '/wp-admin/a/b'].forEach((path) =>
      expect(traps.match(path)).not.toBeNull()
    );
  });

  it('leaves the real pages alone', () => {
    [
      '/',
      '/cg',
      '/cg/pony/v/5-Rainbow-Dash',
      '/admin',
      '/admin/notices',
      '/about',
      '/.well-known/traffic-advice',
      '/env',
      '/wp-administrator',
    ].forEach((path) => expect(traps.match(path)).toBeNull());
  });

  it('understands * (one folder level), ** (anything) and /**/ (also no folder at all)', () => {
    const compiled = compileHoneypots(['/**/.git/**', '/*.php', '/a/**/b']);
    expect(compiled.match('/.git/config')?.name).toBe('any-.git-any');
    expect(compiled.match('/x/y/.git/HEAD')?.name).toBe('any-.git-any');
    expect(compiled.match('/shell.php')?.name).toBe('any.php');
    expect(compiled.match('/dir/shell.php')).toBeNull();
    expect(compiled.match('/a/b')?.name).toBe('a-any-b');
    expect(compiled.match('/a/x/y/b')?.name).toBe('a-any-b');
    expect(compiled.robotsLines).toEqual(['Disallow: /*/.git/*', 'Disallow: /*.php', 'Disallow: /a/*/b']);
  });

  it('does not take what is special in a regular expression for anything special', () => {
    const compiled = compileHoneypots(['/a+b(c)']);
    expect(compiled.match('/a+b(c)')).not.toBeNull();
    expect(compiled.match('/aab')).toBeNull();
  });

  it('names traps the way Luna accepts them (1 to 40 of a-z 0-9 . _ -)', () => {
    const path = `/${'a'.repeat(80)}`;
    expect(compileHoneypots([path]).match(path)?.name).toMatch(/^[a-z0-9._-]{1,40}$/);
    expect(compileHoneypots(['/.env']).match('/.env')?.name).toBe('.env');
  });

  it('hands on the decoy a trap names, the first trap that matches deciding', () => {
    const compiled = compileHoneypots([{ glob: '/wp-admin', decoy: 'wordpress-login' }, '/wp-admin/**']);
    expect(compiled.match('/wp-admin')).toEqual({ name: 'wp-admin', decoy: 'wordpress-login' });
    expect(compiled.match('/wp-admin/x')).toEqual({ name: 'wp-admin-any' });
  });
});
