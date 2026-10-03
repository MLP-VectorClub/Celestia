import { describe, expect, it } from 'vitest';

import { isRenamedInNutshellMode, nutshellAka, nutshellLabel } from 'src/utils/nutshell';

const official = { label: 'Twilight Sparkle', ownerId: null, nutshellNames: ['twily', 'sparkle butt', 'smart one'] };

describe('nutshellLabel', () => {
  it('picks one of the names by the roll, across the whole range', () => {
    expect(nutshellLabel(official, 0)).toBe('twily');
    expect(nutshellLabel(official, 0.4)).toBe('sparkle butt');
    expect(nutshellLabel(official, 0.99)).toBe('smart one');
  });

  it('never runs past the list, even for a roll that is out of range', () => {
    expect(nutshellLabel(official, 1)).toBe('smart one');
    expect(nutshellLabel(official, -3)).toBe('twily');
  });

  it('shows the lowercased label of an official appearance without names', () => {
    expect(nutshellLabel({ label: 'Rarity', ownerId: null, nutshellNames: [] }, 0.5)).toBe('rarity');
    expect(nutshellLabel({ label: 'Rarity' }, 0.5)).toBe('rarity');
  });

  it('never renames the appearances of personal guides, whatever they carry', () => {
    expect(nutshellLabel({ label: 'My OC', ownerId: 42, nutshellNames: [] }, 0.5)).toBe('My OC');
    expect(nutshellLabel({ label: 'My OC', ownerId: 42, nutshellNames: ['sneaky'] }, 0.5)).toBe('My OC');
  });
});

describe('nutshellAka', () => {
  it('is the lowercased real label of an official appearance that has names', () => {
    expect(nutshellAka(official)).toBe('twilight sparkle');
  });

  it('is nothing for appearances without names and for personal guide ones', () => {
    expect(nutshellAka({ label: 'Rarity', ownerId: null, nutshellNames: [] })).toBeNull();
    expect(nutshellAka({ label: 'My OC', ownerId: 42, nutshellNames: ['x'] })).toBeNull();
  });
});

describe('isRenamedInNutshellMode', () => {
  it('is for official appearances only', () => {
    expect(isRenamedInNutshellMode({ label: 'x', ownerId: null })).toBe(true);
    expect(isRenamedInNutshellMode({ label: 'x' })).toBe(true);
    expect(isRenamedInNutshellMode({ label: 'x', ownerId: 7 })).toBe(false);
  });
});
