import { describe, expect, it } from 'vitest';

import { ColorTextParseError, colorsToText, parseColorsText, tokenizeColorLine } from 'src/utils/color-group-text';

describe('colorsToText', () => {
  it('lists one color per line with its ID, blank colors as #', () => {
    expect(
      colorsToText([
        { id: 5, label: 'Fill', hex: '#012ABC' },
        { label: 'Glow', hex: '' },
      ])
    ).toBe('// One color per line, e.g. #012ABC Fill\n#012ABC\tFill\tID:5\n#\tGlow\n');
  });
});

describe('parseColorsText', () => {
  it('reads what colorsToText wrote', () => {
    const rows = [
      { id: 5, label: 'Fill', hex: '#012ABC' },
      { label: 'Glow', hex: '' },
    ];
    expect(parseColorsText(colorsToText(rows))).toEqual(rows);
  });

  it('normalizes hex values and skips comments, empty lines and commented out colors', () => {
    expect(parseColorsText('// note\n\n#abc Outline\n 0f0f0f   Coat Shadow\n//#123456\tOld\tID:9\n')).toEqual([
      { label: 'Outline', hex: '#AABBCC' },
      { label: 'Coat Shadow', hex: '#0F0F0F' },
    ]);
  });

  it('keeps incomplete hex values for the validation to reject', () => {
    expect(parseColorsText('#12 Strange')).toEqual([{ label: 'Strange', hex: '#12' }]);
  });

  it('reports the line and what is missing', () => {
    try {
      parseColorsText('#012ABC Fill\n#012ABC\n');
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(ColorTextParseError);
      const error = e as ColorTextParseError;
      expect(error.lineNumber).toBe(2);
      expect(error.missing).toEqual(['name']);
    }
  });
});

describe('tokenizeColorLine', () => {
  const kinds = (line: string) => tokenizeColorLine(line).map((t) => [t.kind, t.text]);

  it('colors the hex value, name and ID of a line', () => {
    expect(kinds('#012ABC\tFill\tID:5')).toEqual([
      ['hex', '#012ABC'],
      ['plain', '\t'],
      ['name', 'Fill'],
      ['plain', '\t'],
      ['id', 'ID:5'],
    ]);
  });

  it('marks comments, also commented out colors', () => {
    expect(kinds('// note')).toEqual([['comment', '// note']]);
    expect(kinds('//#012ABC\tFill')).toEqual([['comment', '//#012ABC\tFill']]);
  });

  it('flags a hex value of the wrong length and a name that is too short', () => {
    expect(kinds('#0123\tFill')[0]).toEqual(['invalid', '#0123']);
    expect(kinds('#abc\tAb')).toEqual([
      ['hex', '#abc'],
      ['plain', '\t'],
      ['invalid', 'Ab'],
    ]);
  });

  it('keeps every character of the line', () => {
    ['#abc Outline', '0f0f0f  Coat Shadow ID:12', '#', '   ', '#12'].forEach((line) =>
      expect(
        tokenizeColorLine(line)
          .map((t) => t.text)
          .join('')
      ).toBe(line)
    );
  });
});
