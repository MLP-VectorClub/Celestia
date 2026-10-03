/** What the 2020 "nutshell names" mode needs of an appearance: every appearance shape of the API has these */
export interface NutshellSource {
  label: string;
  /** Appearances of personal guides (an owner) are never renamed */
  ownerId?: number | null;
  /** Names the appearance can be shown as, empty when it has none */
  nutshellNames?: readonly string[];
}

/** Official appearances are renamed in this mode, the ones of personal guides never */
export const isRenamedInNutshellMode = (appearance: NutshellSource): boolean => appearance.ownerId == null;

/**
 * The name to show with nutshell names on: one of the appearance's alternative names, picked by `roll` (a number from 0 up to, not including, 1; the
 * caller rolls it so a name stays the same while it is on screen), or the lowercased label when it has none. Personal guide appearances keep their label
 */
export const nutshellLabel = (appearance: NutshellSource, roll: number): string => {
  if (!isRenamedInNutshellMode(appearance)) return appearance.label;
  const names = appearance.nutshellNames ?? [];
  if (names.length === 0) return appearance.label.toLowerCase();
  return names[Math.min(names.length - 1, Math.max(0, Math.floor(roll * names.length)))];
};

/** The real label to list as "also known as" next to a renamed appearance, only for those that have alternative names */
export const nutshellAka = (appearance: NutshellSource): string | null =>
  isRenamedInNutshellMode(appearance) && (appearance.nutshellNames?.length ?? 0) > 0 ? appearance.label.toLowerCase() : null;
