import type { ShowListItem } from '@mlp-vectorclub/api-types';

export const PAGE_SIZE = 8;

/** `count` episodes, 26 to a season, listed the way the API does: newest first */
export const makeEpisodes = (count: number): ShowListItem[] =>
  Array.from({ length: count }, (_, i): ShowListItem => {
    const season = Math.floor(i / 26) + 1;
    const episode = (i % 26) + 1;
    return {
      id: 100 + i,
      type: 'episode',
      title: `Episode S${season}E${episode}`,
      season,
      episode,
      parts: 1,
      no: i + 1,
      airs: new Date(Date.UTC(2010, 9, 10 + i * 7)).toISOString(),
    };
  }).reverse();

/** `count` movies, shorts and specials mixed together (in that order, repeating), newest first */
export const makeOthers = (count: number): ShowListItem[] =>
  Array.from({ length: count }, (_, i): ShowListItem => {
    const types = ['movie', 'short', 'special'] as const;
    const type = types[i % 3];
    return {
      id: 1000 + i,
      type,
      title: `${type[0].toUpperCase()}${type.slice(1)} ${i + 1}`,
      season: null,
      episode: null,
      parts: 1,
      no: i + 1,
      airs: new Date(Date.UTC(2013, 5, 16 + i * 30)).toISOString(),
    };
  }).reverse();

export const pageCount = (entries: unknown[]): number => Math.max(1, Math.ceil(entries.length / PAGE_SIZE));

/** The titles one page of a table should list */
export const titlesOnPage = (entries: ShowListItem[], page: number): string[] =>
  entries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((entry) => entry.title);
