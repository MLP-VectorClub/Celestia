import { describe, expect, it } from 'vitest';

import { hashBlob } from 'src/utils/picker/file-hash';
import { DEFAULT_SETTINGS, SETTINGS_KEY, clearSettings, loadSettings, parseSettings, saveSettings } from 'src/utils/picker/settings';

describe('parseSettings', () => {
  it('uses defaults for nothing or garbage', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('not json')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('42')).toEqual(DEFAULT_SETTINGS);
  });

  it('takes valid values, limits ranges and ignores wrong types', () => {
    expect(parseSettings('{"pickingAreaSize":999,"pickerWidth":10,"copyHash":false}')).toEqual({
      pickingAreaSize: 400,
      pickerWidth: 50,
      copyHash: false,
    });
    expect(parseSettings('{"pickingAreaSize":"big","copyHash":"no"}')).toEqual(DEFAULT_SETTINGS);
  });

  it("understands the old site's percent strings", () => {
    expect(parseSettings('{"pickerWidth":"70%"}').pickerWidth).toBe(70);
  });
});

describe('storage access', () => {
  it('round-trips through a storage', () => {
    const data = new Map<string, string>();
    const storage = {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
      removeItem: (k: string) => void data.delete(k),
    };
    saveSettings({ pickingAreaSize: 40, pickerWidth: 60, copyHash: false }, storage);
    expect(data.has(SETTINGS_KEY)).toBe(true);
    expect(loadSettings(storage)).toEqual({ pickingAreaSize: 40, pickerWidth: 60, copyHash: false });
    clearSettings(storage);
    expect(loadSettings(storage)).toEqual(DEFAULT_SETTINGS);
  });

  it('survives storage that throws or is missing', () => {
    const broken = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    };
    expect(loadSettings(broken)).toEqual(DEFAULT_SETTINGS);
    expect(() => saveSettings(DEFAULT_SETTINGS, broken)).not.toThrow();
    expect(() => clearSettings(broken)).not.toThrow();
    expect(loadSettings(undefined)).toEqual(DEFAULT_SETTINGS);
  });
});

describe('hashBlob', () => {
  it('gives the SHA-256 of the content', async () => {
    expect(await hashBlob(new Blob(['abc']))).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('is equal for equal content and different otherwise', async () => {
    expect(await hashBlob(new Blob(['x']))).toBe(await hashBlob(new Blob(['x'])));
    expect(await hashBlob(new Blob(['x']))).not.toBe(await hashBlob(new Blob(['y'])));
  });
});
