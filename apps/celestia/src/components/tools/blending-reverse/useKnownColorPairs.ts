import { useMemo, useRef, useState } from 'react';

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

/** The editable list of original/filtered color pairs (always at least two rows) and the pairs where both colors parse */
export function useKnownColorPairs() {
  // Row IDs end up in element IDs, so they are counted per picker: a counter shared by the whole module would differ between server and browser
  const lastId = useRef(0);
  const blankPair = (): KnownPair => ({ id: ++lastId.current, original: '', filtered: '' });
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
