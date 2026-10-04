/** A date whose local clock shows the UTC clock of `date`, so formatting it prints the same text in every time zone (the server's and the visitor's) */
export const utcClock = (date: Date): Date =>
  new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
