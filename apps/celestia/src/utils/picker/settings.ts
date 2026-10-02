import { clampAreaSize } from 'src/utils/picker/areas';

export interface PickerSettings {
  /** Size given to newly placed picking areas */
  pickingAreaSize: number;
  /** Share of the width used by the image area, the rest is the area list, 50–85 */
  pickerWidth: number;
  /** Whether copying an average color includes the `#` */
  copyHash: boolean;
}

export const DEFAULT_SETTINGS: PickerSettings = { pickingAreaSize: 25, pickerWidth: 85, copyHash: true };
export const SETTINGS_KEY = 'picker_settings';

type ReadStorage = Pick<Storage, 'getItem'>;

const clampWidth = (width: number) => Math.min(85, Math.max(50, width));

/** Applies whatever valid values the stored JSON has on top of the defaults (`"85%"`-style widths from the old site are understood) */
export function parseSettings(json: string | null): PickerSettings {
  const settings = { ...DEFAULT_SETTINGS };
  if (!json) return settings;
  let stored: unknown;
  try {
    stored = JSON.parse(json);
  } catch {
    return settings;
  }
  if (typeof stored !== 'object' || stored === null) return settings;
  const { pickingAreaSize, pickerWidth, copyHash } = stored as Record<string, unknown>;
  if (typeof pickingAreaSize === 'number' && Number.isFinite(pickingAreaSize)) settings.pickingAreaSize = clampAreaSize(pickingAreaSize);
  const width = typeof pickerWidth === 'string' ? parseFloat(pickerWidth) : pickerWidth;
  if (typeof width === 'number' && Number.isFinite(width)) settings.pickerWidth = clampWidth(width);
  if (typeof copyHash === 'boolean') settings.copyHash = copyHash;
  return settings;
}

/** Storage can be missing or throw (private windows, blocked site data), the defaults are used then */
export function loadSettings(
  storage: ReadStorage | undefined = typeof localStorage === 'undefined' ? undefined : localStorage
): PickerSettings {
  try {
    return parseSettings(storage?.getItem(SETTINGS_KEY) ?? null);
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(
  settings: PickerSettings,
  storage: Pick<Storage, 'setItem'> | undefined = typeof localStorage === 'undefined' ? undefined : localStorage
) {
  try {
    storage?.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* settings just won't persist */
  }
}

export function clearSettings(
  storage: Pick<Storage, 'removeItem'> | undefined = typeof localStorage === 'undefined' ? undefined : localStorage
) {
  try {
    storage?.removeItem(SETTINGS_KEY);
  } catch {
    /* nothing to clear */
  }
}
