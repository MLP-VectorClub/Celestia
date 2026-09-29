import path from 'node:path';
import * as sass from 'sass';
import { describe, expect, it } from 'vitest';

const appRoot = path.resolve(__dirname, '../../..');

// Compiles a snippet that writes Sass values out as `name: value` declarations and reads them back
const compileValues = (source: string): Record<string, string> => {
  const { css } = sass.compileString(source, {
    loadPaths: [path.join(appRoot, 'src'), path.join(appRoot, 'node_modules')],
    quietDeps: true,
    logger: sass.Logger.silent,
  });
  const block = css.slice(css.lastIndexOf('.values {'));
  return Object.fromEntries([...block.matchAll(/^\s+([\w-]+): (.+);$/gm)].map(([, name, value]) => [name, value]));
};

// Each test compiles all of Bootstrap (up to twice), which can take several seconds on slower CI
// runners with coverage enabled, well past Vitest's 5s default
describe('Bootstrap values copied into our SCSS', { timeout: 30_000 }, () => {
  it('should keep _bootstrap-defaults.scss in sync with the configured Bootstrap', () => {
    const values = compileValues(`
      @use 'sass:map';
      @use 'sass:meta';
      @use 'scss/bootstrap' as bs;
      @use 'scss/bootstrap-defaults' as defaults;
      .values {
        @each $name, $value in meta.module-variables('defaults') {
          #{$name}-copy: meta.inspect($value);
          #{$name}-bootstrap: meta.inspect(map.get(meta.module-variables('bs'), $name));
        }
      }
    `);
    const names = Object.keys(values)
      .filter((key) => key.endsWith('-copy'))
      .map((key) => key.replace(/-copy$/, ''));

    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(values[`${name}-copy`], `$${name}`).toEqual(values[`${name}-bootstrap`]);
    }
  });

  it("should keep Bootstrap's default theme colors in _bootstrap.scss", () => {
    const emitThemeColors = (use: string) =>
      compileValues(`
        @use 'sass:map';
        @use 'sass:meta';
        ${use}
        .values {
          @each $name in success, warning, danger, light, dark {
            #{$name}: meta.inspect(map.get(bs.$theme-colors, $name));
          }
        }
      `);

    expect(emitThemeColors("@use 'scss/bootstrap' as bs;")).toEqual(emitThemeColors("@use 'bootstrap-scss/bootstrap' as bs;"));
  });
});
