import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const dist = path.join(__dirname, '../../../public/dist');
const read = (name: string) => readFileSync(path.join(dist, name), 'utf8');

// The guide pages link these files, other tools (the Illustrator swatch import script, the color guide export's `$schema`) read them
describe('files served at /dist', () => {
  it('has the schema of the color guide export', () => {
    const schema = JSON.parse(read('mlpvc-colorguide-schema.json'));

    expect(schema.required).toEqual(['Appearances', 'Tags']);
    expect(Object.keys(schema.definitions)).toEqual(expect.arrayContaining(['Appearance', 'Tag', 'ColorGroup', 'CutieMark']));
  });

  it('has the swatch import script that the swatch dialog links', () => {
    expect(read('Import Swatches from JSON.jsx')).toContain('Import swatches from JSON');
  });
});
