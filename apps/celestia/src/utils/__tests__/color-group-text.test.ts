import { describe, expect, it } from 'vitest';

import { ColorTextParseError, colorsToText, parseColorsText, tokenizeColorLine } from 'src/utils/color-group-text';

describe('colorsToText', () => {
  it('lists one color per line with its ID, blank colors as #', () => {
    expect(
      colorsToText([
        { id: 5, label: 'Fill', hex: '#012ABC' },
        { label: 'Glow', hex: '' },
      ])
    ).toBe('// One color per line, e.g. #012ABC "Fill" 40% overlay\n#012ABC "Fill" ID:5\n# "Glow"\n');
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

describe('names in double quotes, opacity and blend mode in the plain text list', () => {
  const rows = [
    { id: 5, label: 'Lens', hex: '#012ABC', opacity: 40, blendMode: 'overlay' as const },
    { label: 'Shine', hex: '#FFFFFF', opacity: 50 },
    { label: 'Frame', hex: '#000000', blendMode: 'multiply' as const },
    { label: 'Glow', hex: '#00FF00', opacity: 25, blendMode: 'color-dodge' as const },
  ];

  it('writes them after the quoted name, separated by single spaces, and reads them back', () => {
    const text = colorsToText(rows);

    expect(text).not.toContain('\t');
    expect(text).toContain('#012ABC "Lens" 40% overlay ID:5\n');
    expect(text).toContain('#FFFFFF "Shine" 50%\n');
    expect(text).toContain('#000000 "Frame" 100% multiply\n');
    expect(parseColorsText(text)).toEqual(rows);
  });

  it('treats any run of whitespace between the parts as one separator, and reads blend modes in any case or with a space', () => {
    expect(parseColorsText('#012ABC\t "Lens Fill"   40%\tOverlay\n#00ff00 "Glow"   25% color dodge   ID:7\n')).toEqual([
      { label: 'Lens Fill', hex: '#012ABC', opacity: 40, blendMode: 'overlay' },
      { id: 7, label: 'Glow', hex: '#00FF00', opacity: 25, blendMode: 'color-dodge' },
    ]);
  });

  it('keeps everything inside the quotes as it is, including quotes and percentages', () => {
    const tricky = [
      { label: 'Say "hi" \\o/', hex: '#000000' },
      { label: '50% Gray 40% overlay', hex: '#808080', opacity: 30 },
    ];

    expect(parseColorsText(colorsToText(tricky))).toEqual(tricky);
    expect(colorsToText(tricky)).toContain('#000000 "Say \\"hi\\" \\\\o/"\n');
  });

  it('trims the name', () => {
    expect(parseColorsText('#012ABC "  padded  "\n')).toEqual([{ label: 'padded', hex: '#012ABC' }]);
  });

  it('does not write normal blending or full opacity', () => {
    expect(colorsToText([{ label: 'Frame', hex: '#000000', opacity: null, blendMode: 'normal' }])).toBe(
      '// One color per line, e.g. #012ABC "Fill" 40% overlay\n#000000 "Frame"\n'
    );
    expect(parseColorsText('#000000 "Frame" 100% normal\n')).toEqual([{ label: 'Frame', hex: '#000000' }]);
  });

  it('still reads the lines without quotes of the old site, and skips commented out colors', () => {
    expect(parseColorsText('#012ABC Lens Fill 40% Overlay\n#000000\t50% Gray\n//#123456 "Old" ID:9\n')).toEqual([
      { label: 'Lens Fill', hex: '#012ABC', opacity: 40, blendMode: 'overlay' },
      { label: '50% Gray', hex: '#000000' },
    ]);
  });

  it.each(['0%', '150%', '40% glow', '40 % overlay', 'Fill'])('rejects %s after the name', (tail) => {
    expect(() => parseColorsText(`#012ABC "Lens" ${tail}\n`)).toThrow(ColorTextParseError);
  });

  it.each(['""', '"ab"', '"a name that is much too long for a color"'])('rejects the name %s', (name) => {
    try {
      parseColorsText(`#012ABC ${name}\n`);
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(ColorTextParseError);
      expect((e as ColorTextParseError).missing).toEqual(['name']);
    }
  });

  it('highlights the parts and keeps every character', () => {
    const line = '#012ABC "Lens" 40% overlay ID:5';
    const tokens = tokenizeColorLine(line);

    expect(tokens.map((t) => t.text).join('')).toBe(line);
    expect(tokens.map((t) => [t.kind, t.text]).filter(([, text]) => text.trim() !== '')).toEqual([
      ['hex', '#012ABC'],
      ['name', '"Lens"'],
      ['id', '40%'],
      ['id', 'overlay'],
      ['id', 'ID:5'],
    ]);
  });

  it('marks what cannot be read after the name as invalid', () => {
    expect(tokenizeColorLine('#012ABC "Lens" 150%').slice(-1)).toEqual([{ kind: 'invalid', text: ' 150%' }]);
  });
});
