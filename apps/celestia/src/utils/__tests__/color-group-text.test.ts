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

describe('opacity and blend mode in the plain text list', () => {
  const rows = [
    { id: 5, label: 'Lens', hex: '#012ABC', opacity: 40, blendMode: 'overlay' as const },
    { label: 'Shine', hex: '#FFFFFF', opacity: 50 },
    { label: 'Frame', hex: '#000000' },
  ];

  it('writes them after the name and reads them back', () => {
    const text = colorsToText(rows);

    expect(text).toContain('#012ABC\tLens\tOP:40\tBLEND:overlay\tID:5\n');
    expect(parseColorsText(text)).toEqual(rows);
  });

  it('does not write normal blending or full opacity', () => {
    expect(colorsToText([{ label: 'Frame', hex: '#000000', opacity: null, blendMode: 'normal' }])).toBe(
      '// One color per line, e.g. #012ABC Fill\n#000000\tFrame\n'
    );
  });

  it.each(['OP:0', 'OP:100', 'OP:half', 'BLEND:glow'])('rejects %s', (option) => {
    expect(() => parseColorsText(`#012ABC\tLens\t${option}\n`)).toThrow(ColorTextParseError);
  });

  it('highlights them like the ID and keeps every character', () => {
    const line = '#012ABC\tLens\tOP:40\tBLEND:overlay\tID:5';
    const tokens = tokenizeColorLine(line);

    expect(tokens.map((t) => t.text).join('')).toBe(line);
    expect(tokens.filter((t) => t.kind === 'id').map((t) => t.text)).toEqual(['OP:40', 'BLEND:overlay', 'ID:5']);
  });
});
