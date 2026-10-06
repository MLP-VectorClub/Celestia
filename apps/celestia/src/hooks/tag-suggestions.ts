import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { TagService } from 'src/services/tags';

/** Tags whose name contains the text (staff only), looked up a moment after the typing stopped; nothing is asked for an empty text */
export function useTagSuggestions(text: string, options: { not?: number; enabled?: boolean } = {}) {
  const [settled, setSettled] = useState(text);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(text), 200);
    return () => clearTimeout(timer);
  }, [text]);

  const query = settled.trim();
  const { data } = useQuery({
    queryKey: ['/tags/autocomplete', query, options.not ?? null],
    queryFn: () => TagService.autocomplete(query, options.not).then((r) => r.data.tags),
    enabled: (options.enabled ?? true) && query.length > 0,
    staleTime: 60 * 1000,
  });
  return query.length > 0 ? (data ?? []) : [];
}
