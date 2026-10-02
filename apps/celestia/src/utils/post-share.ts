/** Highest value of the database's integer IDs, anything above cannot be a post */
const MAX_POST_ID = 2147483647;

/** Short links carry the post ID in base 36 (`/s/1z`), `null` for anything else */
export function parseSharedPostId(segment: string): number | null {
  if (!/^[0-9a-z]+$/i.test(segment)) return null;
  const id = parseInt(segment, 36);
  return Number.isSafeInteger(id) && id >= 1 && id <= MAX_POST_ID ? id : null;
}

/** The number of a `/episodes/3` or `/movies/3` page segment, 1 when there is none or it is not a positive whole number */
export function parseListPage(segment: string | string[] | undefined): number {
  const value = Array.isArray(segment) ? segment[0] : segment;
  return value && /^\d+$/.test(value) && Number(value) > 0 ? Number(value) : 1;
}
