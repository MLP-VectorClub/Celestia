import { BLEND_MODES, BlendMode } from 'src/types/sprite-colors';

export interface ColorTextRow {
  /** Rows without an ID are created, rows that disappear from the list are deleted by the API */
  id?: number;
  label: string;
  hex: string;
  /** Percent, 1 to 99, nothing for fully opaque */
  opacity?: number | null;
  /** Nothing for normal */
  blendMode?: BlendMode | null;
}

/** A line of the plain text editor that cannot be read, with what is missing from it */
export class ColorTextParseError extends Error {
  readonly lineNumber: number;

  readonly line: string;

  readonly missing: Array<'hex' | 'name'>;

  constructor(line: string, lineNumber: number, missing: Array<'hex' | 'name'>) {
    super(`Parse error on line ${lineNumber}`);
    this.line = line;
    this.lineNumber = lineNumber;
    this.missing = missing;
  }
}

export const COLOR_TEXT_HEADER = '// One color per line, e.g. #012ABC "Fill" 40% overlay';

/** Three digit shorthands become six digits and everything is upper case; anything else that was typed is kept for the validation to complain about */
const normalizeHex = (digits: string): string => {
  if (digits === '') return '';
  if (/^[a-f\d]{3}$/i.test(digits)) return `#${digits.replace(/./g, '$&$&')}`.toUpperCase();
  return `#${digits}`.toUpperCase();
};

/** How much a color shows and how it blends, as written after the name: `40%` (normal blending), `40% overlay`, `100% multiply` */
const blendingText = (row: ColorTextRow): string[] => {
  const mode = row.blendMode && row.blendMode !== 'normal' ? ` ${row.blendMode}` : '';
  return row.opacity || mode ? [`${row.opacity || 100}%${mode}`] : [];
};

/** The name in double quotes, with `"` and `\\` escaped */
const quote = (label: string): string => `"${label.replace(/[\\"]/g, '\\$&')}"`;

/**
 * The plain text color list, one color per line: `hex "name" 40% overlay ID:n`. The opacity and blend mode are only written for
 * colors that have them (nothing for fully opaque, normal blending) and the ID for colors that exist already
 */
export const colorsToText = (rows: ColorTextRow[]): string =>
  `${[
    COLOR_TEXT_HEADER,
    ...rows.map((row) => [row.hex || '#', quote(row.label), ...blendingText(row), ...(row.id ? [`ID:${row.id}`] : [])].join(' ')),
  ].join('\n')}\n`;

/** An opacity (percent) and blend mode name as typed, checked: 100% and normal are how a fully opaque, normally blended color is written */
const readBlending = (percentText: string | undefined, modeText: string | undefined) => {
  const percent = percentText === undefined ? 100 : Number(percentText);
  const mode = modeText?.toLowerCase().replace(/\s+/g, '-');
  const validMode = mode === undefined || BLEND_MODES.includes(mode as BlendMode);
  const validPercent = percent >= 1 && percent <= 100;
  return {
    ...(validPercent && percent < 100 ? { opacity: percent } : {}),
    ...(validMode && mode && mode !== 'normal' ? { blendMode: mode as BlendMode } : {}),
    invalid: !validMode || !validPercent,
  };
};

/** A line with the name in double quotes: HEX, "name", then optionally `40%` and a blend mode, then optionally `ID:n` */
const QUOTED_LINE = /^(\/\/)?#?([a-f\d]{0,6})\s+"((?:[^"\\]|\\.)*)"(.*)$/i;
const QUOTED_TAIL = /^\s*(?:(\d+)%(?:\s+([a-z]+(?:[-\s][a-z]+)?))?)?\s*(?:ID:(\d+))?\s*$/i;
const unquote = (quoted: string): string => quoted.replace(/\\(.)/g, '$1');
const validName = (label: string): boolean => /^[ -~]{3,30}$/.test(label);

/** The opacity and blend mode at the end of an unquoted line (before the ID): a percentage, then optionally the name of the blend mode */
const BLENDING_PATTERN = /\s+(\d+)%(?:\s+([a-z]+(?:[-\s][a-z]+)?))?(?=\s*(?:ID:\d+)?\s*$)/i;

const findBlending = (line: string): RegExpExecArray | null => {
  const match = BLENDING_PATTERN.exec(line);
  // Right after the HEX value it is the start of the name ("#000000<TAB>50% Gray"), the name comes first
  return match && !/^(?:\/\/)?#?[a-f\d]*$/i.test(line.slice(0, match.index).trim()) ? match : null;
};

/** The opacity and blend mode written at the end of an unquoted line (before the ID), and the line without them */
const splitBlending = (line: string): { rest: string; opacity?: number; blendMode?: BlendMode; invalid: boolean } => {
  const match = findBlending(line);
  if (!match) return { rest: line, invalid: false };

  return { rest: line.slice(0, match.index) + line.slice(match.index + match[0].length), ...readBlending(match[1], match[2]) };
};

/**
 * Reads the list back. Empty lines and comments are skipped, and so are commented out colors (`//#012ABC "Fill"`): a color that is left out
 * is deleted, like in the interactive editor. A name is 3-30 printable characters in double quotes; the old site's lines without quotes are
 * still read, the name then runs up to the opacity or the ID.
 * @throws ColorTextParseError
 */
export const parseColorsText = (text: string): ColorTextRow[] => {
  const rows: ColorTextRow[] = [];
  text.split('\n').forEach((line, index) => {
    const trimmed = line.trim();
    if (/^(\/\/($|[^#@].*))?$/.test(trimmed)) return;

    if (trimmed === '#') {
      rows.push({ label: '', hex: '' });
      return;
    }

    const quoted = QUOTED_LINE.exec(trimmed);
    if (quoted) {
      const label = unquote(quoted[3]).trim();
      const tail = QUOTED_TAIL.exec(quoted[4]);
      const blending = tail ? readBlending(tail[1], tail[2]) : null;
      if (!tail || !blending || blending.invalid) throw new ColorTextParseError(line, index + 1, []);
      if (!validName(label)) throw new ColorTextParseError(line, index + 1, ['name']);
      if (quoted[1]) return;
      rows.push({
        ...(tail[3] ? { id: Number(tail[3]) } : {}),
        label,
        hex: normalizeHex(quoted[2] ?? ''),
        ...(blending.opacity ? { opacity: blending.opacity } : {}),
        ...(blending.blendMode ? { blendMode: blending.blendMode } : {}),
      });
      return;
    }

    const options = splitBlending(trimmed);
    const matches = /^(?:(\/\/)?#?([a-f\d]{0,6})?)?\s+([ -~]{3,30})?(?:\s*ID:(\d+))?$/i.exec(options.rest);
    if (matches?.[3] && !options.invalid) {
      if (matches[1]) return;
      rows.push({
        ...(matches[4] ? { id: Number(matches[4]) } : {}),
        label: matches[3].trim(),
        hex: normalizeHex(matches[2] ?? ''),
        ...(options.opacity ? { opacity: options.opacity } : {}),
        ...(options.blendMode ? { blendMode: options.blendMode } : {}),
      });
      return;
    }

    const missing: Array<'hex' | 'name'> = [];
    if (!/^(?:\/\/)?(?:#[a-f\d]{1,6}|[a-f\d]{3,6})(?:\s|$)/i.test(trimmed)) missing.push('hex');
    if (!matches?.[3]) missing.push('name');
    throw new ColorTextParseError(line, index + 1, missing);
  });

  return rows;
};

export type ColorTextTokenKind = 'comment' | 'hex' | 'name' | 'id' | 'invalid' | 'plain';

export interface ColorTextToken {
  text: string;
  kind: ColorTextTokenKind;
}

/** A line with the name in double quotes: the HEX value, the quoted name, and the opacity, blend mode and ID after it (marked like the ID) */
const tokenizeQuotedLine = (line: string, quoted: RegExpExecArray): ColorTextToken[] => {
  const nameStart = line.indexOf('"');
  const nameEnd = nameStart + quoted[3].length + 2;
  const hex = line.slice(0, line.slice(0, nameStart).trimEnd().length);
  const digits = hex.replace(/^#/, '');
  const tokens: ColorTextToken[] = [
    { text: hex, kind: digits.length === 3 || digits.length === 6 || hex === '#' ? 'hex' : 'invalid' },
    { text: line.slice(hex.length, nameStart), kind: 'plain' },
    { text: line.slice(nameStart, nameEnd), kind: validName(unquote(quoted[3])) ? 'name' : 'invalid' },
  ];

  const rest = line.slice(nameEnd);
  const tail = QUOTED_TAIL.exec(rest);
  const blending = tail ? readBlending(tail[1], tail[2]) : null;
  if (!tail || !blending || blending.invalid) {
    if (rest !== '') tokens.push({ text: rest, kind: 'invalid' });
  } else {
    // Spaces between the parts stay plain
    rest.split(/(\s+)/).forEach((part, i) => {
      if (part !== '') tokens.push({ text: part, kind: i % 2 === 1 ? 'plain' : 'id' });
    });
  }

  return tokens;
};

/**
 * Splits one line of the plain text editor into the parts the highlighting colors (the old site's CodeMirror mode): comments (also colors that are
 * commented out), the HEX value, the name and the ID of an existing color; whatever cannot be read is `invalid`
 */
export const tokenizeColorLine = (line: string): ColorTextToken[] => {
  if (/^\/\//.test(line)) return [{ text: line, kind: 'comment' }];
  if (line === '') return [];

  const quoted = QUOTED_LINE.exec(line);
  if (quoted) return tokenizeQuotedLine(line, quoted);

  // The opacity and blend mode are blanked out for the reading below and put back, marked like the ID, afterwards
  const found = findBlending(line);
  if (found) {
    const from = found.index + found[0].length - found[0].trimStart().length;
    const to = found.index + found[0].length;
    const result: ColorTextToken[] = [];
    let at = 0;
    tokenizeColorLine(`${line.slice(0, from)}${' '.repeat(to - from)}${line.slice(to)}`).forEach((token) => {
      const end = at + token.text.length;
      const cuts = [from, to].filter((n) => n > at && n < end);
      let cursor = at;
      [...cuts, end].forEach((stop) => {
        result.push({ text: line.slice(cursor, stop), kind: cursor >= from && stop <= to ? 'id' : token.kind });
        cursor = stop;
      });
      at = end;
    });
    return result;
  }

  const tokens: ColorTextToken[] = [];
  let rest = line;
  const take = (length: number, kind: ColorTextTokenKind) => {
    tokens.push({ text: rest.slice(0, length), kind });
    rest = rest.slice(length);
  };

  const hex = /^#?[a-f\d]*/i.exec(rest)?.[0] ?? '';
  const digits = hex.replace('#', '');
  if (hex !== '') take(hex.length, digits.length === 3 || digits.length === 6 || (hex === '#' && rest.trim() === '#') ? 'hex' : 'invalid');

  const spacing = /^\s*/.exec(rest)?.[0] ?? '';
  if (spacing !== '') take(spacing.length, 'plain');
  if (rest === '') return tokens;

  const withId = /^(.*?)(\s*)(ID:)(\d+)(\s*)$/.exec(rest);
  const name = withId ? withId[1] : rest.trimEnd();
  if (name.length >= 3 && name.length <= 30 && /^[ -~]+$/.test(name)) take(name.length, 'name');
  else if (name !== '') take(name.length, 'invalid');
  if (rest === '') return tokens;

  if (withId && /^\s*ID:\d+\s*$/.test(rest)) {
    const gap = /^\s*/.exec(rest)?.[0] ?? '';
    if (gap !== '') take(gap.length, 'plain');
    take(rest.trimEnd().length, 'id');
    if (rest !== '') take(rest.length, 'plain');
  } else take(rest.length, rest.trim() === '' ? 'plain' : 'invalid');

  return tokens;
};
