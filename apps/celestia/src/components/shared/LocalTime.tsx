import { format as formatDate, isValid } from 'date-fns';
import { FC, TimeHTMLAttributes, useEffect, useState } from 'react';

import { utcClock } from 'src/utils/utc-clock';

interface PropTypes extends Omit<TimeHTMLAttributes<HTMLTimeElement>, 'dateTime' | 'children'> {
  /** ISO timestamp */
  date: string;
  /** A date-fns format */
  format: string;
}

/**
 * A moment in the visitor's own time zone. The server and the first render in the browser show it as UTC, because the time zone of the server is not
 * the visitor's and text that differs between the two breaks hydration, and the browser switches to the visitor's time right after
 */
export const LocalTime: FC<PropTypes> = ({ date, format, ...rest }) => {
  const [local, setLocal] = useState(false);
  useEffect(() => setLocal(true), []);

  const moment = new Date(date);
  return (
    <time dateTime={date} {...rest}>
      {isValid(moment) ? formatDate(local ? moment : utcClock(moment), format) : date}
    </time>
  );
};
