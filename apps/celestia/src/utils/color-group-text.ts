export interface ColorTextRow {
  /** Rows without an ID are created, rows that disappear from the list are deleted by the API */
  id?: number;
  label: string;
  hex: string;
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

export const COLOR_TEXT_HEADER = '// One color per line, e.g. #012ABC Fill';

/** Three digit shorthands become six digits and everything is upper case; anything else that was typed is kept for the validation to complain about */
const normalizeHex = (digits: string): string => {
  if (digits === '') return '';
  if (/^[a-f\d]{3}$/i.test(digits)) return `#${digits.replace(/./g, '$&$&')}`.toUpperCase();
  return `#${digits}`.toUpperCase();
};

/** The old site's plain text color list: `hex<TAB>name<TAB>ID:n`, one color per line */
export const colorsToText = (rows: ColorTextRow[]): string =>
  `${[COLOR_TEXT_HEADER, ...rows.map((row) => [row.hex || '#', row.label, ...(row.id ? [`ID:${row.id}`] : [])].join('\t'))].join('\n')}\n`;

/**
 * Reads the list back. Empty lines and comments are skipped, and so are commented out colors (`//#012ABC<TAB>Fill`): a color that is left out
 * is deleted, like in the interactive editor. A name is 3-30 printable characters.
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

    const matches = /^(?:(\/\/)?#?([a-f\d]{0,6})?)?\s+([ -~]{3,30})?(?:\s*ID:(\d+))?$/i.exec(trimmed);
    if (matches?.[3]) {
      if (matches[1]) return;
      rows.push({ ...(matches[4] ? { id: Number(matches[4]) } : {}), label: matches[3].trim(), hex: normalizeHex(matches[2] ?? '') });
      return;
    }

    const missing: Array<'hex' | 'name'> = [];
    if (!/^(?:\/\/)?(?:#[a-f\d]{1,6}|[a-f\d]{3,6})(?:\s|$)/i.test(trimmed)) missing.push('hex');
    if (!matches?.[3]) missing.push('name');
    throw new ColorTextParseError(line, index + 1, missing);
  });

  return rows;
};
