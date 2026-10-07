import { describe, expect, it } from 'vitest';

import { ColorTextParseError, colorsToText, parseColorsText } from 'src/utils/color-group-text';

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
