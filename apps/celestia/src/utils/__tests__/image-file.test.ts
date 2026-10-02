import { describe, expect, it } from 'vitest';

import { filterFreeFileName } from 'src/utils/image-file';

describe('filterFreeFileName', () => {
  it('adds the note and saves as PNG', () => {
    expect(filterFreeFileName('photo.png', 'multiply')).toBe('photo (no multiply filter).png');
    expect(filterFreeFileName('C:\\pics\\a.b.jpg', 'normal')).toBe('a.b (no normal filter).png');
  });

  it('falls back when there is no usable name', () => {
    expect(filterFreeFileName(null, 'normal')).toBe('image (no normal filter).png');
    expect(filterFreeFileName('noext', 'normal')).toBe('noext (no normal filter).png');
  });
});
