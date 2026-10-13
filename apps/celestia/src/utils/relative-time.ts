const YEAR_DAYS = 365.2425;
const MONTH_DAYS = 146097 / 4800;

/**
 * "5 minutes ago", "in 2 hours", "a year ago": the wording and the thresholds of moment.js's `fromNow()`, which the old site printed everywhere
 * (date-fns says "about 5 years ago" and "less than 5 seconds ago" instead). Moment rounds each unit on its own and picks the largest one that fits:
 * up to 44 seconds is "a few seconds", then a minute, up to 44 minutes, an hour, up to 21 hours, a day, up to 25 days, a month, up to 10 months, a year.
 */
export const relativeTime = (date: Date | number, now: Date | number = Date.now()): string => {
  const diffMs = new Date(date).getTime() - new Date(now).getTime();
  const past = diffMs <= 0;
  const seconds = Math.abs(diffMs) / 1000;
  const days = seconds / 86400;

  const rSeconds = Math.round(seconds);
  const rMinutes = Math.round(seconds / 60);
  const rHours = Math.round(seconds / 3600);
  const rDays = Math.round(days);
  const rMonths = Math.round(days / MONTH_DAYS);
  const rYears = Math.round(days / YEAR_DAYS);

  let text: string;
  if (rSeconds <= 44) text = 'a few seconds';
  else if (rMinutes <= 1) text = 'a minute';
  else if (rMinutes < 45) text = `${rMinutes} minutes`;
  else if (rHours <= 1) text = 'an hour';
  else if (rHours < 22) text = `${rHours} hours`;
  else if (rDays <= 1) text = 'a day';
  else if (rDays < 26) text = `${rDays} days`;
  else if (rMonths <= 1) text = 'a month';
  else if (rMonths < 11) text = `${rMonths} months`;
  else if (rYears <= 1) text = 'a year';
  else text = `${rYears} years`;

  return past ? `${text} ago` : `in ${text}`;
};
