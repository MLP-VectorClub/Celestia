import { GetConfigResult } from '@mlp-vectorclub/api-types';

export type ConfigPatterns = Record<keyof GetConfigResult['patterns'], RegExp>;

/**
 * `GET /config` sends patterns as `{source, flags}` (never as `/…/` literals) so they can be rebuilt here
 */
export const compilePattern = ({ source, flags }: GetConfigResult['patterns'][keyof GetConfigResult['patterns']]): RegExp =>
  new RegExp(source, flags);

export const compilePatterns = (patterns: GetConfigResult['patterns']): ConfigPatterns => ({
  printableAscii: compilePattern(patterns.printableAscii),
  hexColor: compilePattern(patterns.hexColor),
  username: compilePattern(patterns.username),
  episodeTitle: compilePattern(patterns.episodeTitle),
});
