import { useMemo, useState } from 'react';

import { BlendingResult, findOriginalColor, parseColor } from 'src/utils/color';

export type BlendingField = 'bg1' | 'blend1' | 'bg2' | 'blend2';

const DEFAULTS: Record<BlendingField, string> = { bg1: '#ffffff', blend1: '#daf6f7', bg2: '#000000', blend2: '#9bb5b6' };

/** Holds the four color inputs and the solved original color (`null` while an input is invalid or both backgrounds match) */
export function useBlending() {
  const [values, setValues] = useState(DEFAULTS);

  const result = useMemo<BlendingResult | null>(() => {
    const bg1 = parseColor(values.bg1);
    const blend1 = parseColor(values.blend1);
    const bg2 = parseColor(values.bg2);
    const blend2 = parseColor(values.blend2);
    return bg1 && blend1 && bg2 && blend2 ? findOriginalColor({ bg1, blend1, bg2, blend2 }) : null;
  }, [values]);

  const setField = (field: BlendingField, value: string) => setValues((all) => ({ ...all, [field]: value }));

  return { values, setField, result };
}
