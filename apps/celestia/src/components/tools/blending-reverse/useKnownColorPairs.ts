import { useMemo, useState } from 'react';

import { Rgb, parseColor } from 'src/utils/color';

export interface KnownPair {
  id: number;
  original: string;
  filtered: string;
}

export interface ValidPairs {
  originals: Rgb[];
  filtered: Rgb[];
}

let nextId = 0;
const blankPair = (): KnownPair => ({ id: ++nextId, original: '', filtered: '' });

/** The editable list of original/filtered color pairs (always at least two rows) and the pairs where both colors parse */
export function useKnownColorPairs() {
  const [pairs, setPairs] = useState<KnownPair[]>(() => [blankPair(), blankPair()]);

  const valid = useMemo<ValidPairs>(() => {
    const result: ValidPairs = { originals: [], filtered: [] };
    pairs.forEach((pair) => {
      const original = parseColor(pair.original);
      const filtered = parseColor(pair.filtered);
      if (original && filtered) {
        result.originals.push(original);
        result.filtered.push(filtered);
      }
    });
    return result;
  }, [pairs]);

  return {
    pairs,
    valid,
    update: (id: number, patch: Partial<Pick<KnownPair, 'original' | 'filtered'>>) =>
      setPairs((all) => all.map((p) => (p.id === id ? { ...p, ...patch } : p))),
    add: () => setPairs((all) => [...all, blankPair()]),
    remove: (id: number) => setPairs((all) => (all.length > 2 ? all.filter((p) => p.id !== id) : all)),
  };
}
