import { FC, useEffect, useMemo, useState } from 'react';

import { formatLongDate } from 'src/utils';

/**
 * A date in the visitor's own time zone. The server does not know that zone, so the first render (server and browser) shows the same UTC text and
 * the local one replaces it right after hydration, which keeps the markup identical on both sides
 */
export const LongDate: FC<{ date: Date | string }> = ({ date: input }) => {
  const date = useMemo(() => new Date(input), [input]);
  const [text, setText] = useState(() => date.toUTCString());
  useEffect(() => setText(formatLongDate(date)), [date]);
  return <time dateTime={date.toISOString()}>{text}</time>;
};
