import path from 'node:path';
import postcss, { AtRule, Root, Rule } from 'postcss';
import * as sass from 'sass';

const appRoot = path.resolve(__dirname, '../../..');

let compiled: Root | undefined;

/** The global stylesheet (`app.scss`, all of Bootstrap included) as a PostCSS tree; compiled once per test file */
export function compileApp(): Root {
  compiled ??= postcss.parse(
    sass.compile(path.join(appRoot, 'src/app.scss'), {
      loadPaths: [path.join(appRoot, 'src'), path.join(appRoot, 'node_modules')],
      quietDeps: true,
      logger: sass.Logger.silent,
    }).css
  );
  return compiled;
}

export const isDarkMedia = (node: AtRule) => node.name === 'media' && /prefers-color-scheme:\s*dark/.test(node.params);

/** The rules that sit directly in the stylesheet, not inside a media query */
export function rulesOutsideMedia(root: Root): Rule[] {
  const rules: Rule[] = [];
  root.walkRules((rule) => {
    if (rule.parent?.type === 'root') rules.push(rule);
  });
  return rules;
}

export function rulesInDarkMedia(root: Root): Rule[] {
  const rules: Rule[] = [];
  root.walkAtRules((atRule) => {
    if (isDarkMedia(atRule)) {
      atRule.walkRules((rule) => {
        rules.push(rule);
      });
    }
  });
  return rules;
}
