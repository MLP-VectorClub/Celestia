import { Nullable } from 'src/types';

export const episodeToString = (show: { episode: Nullable<number>; parts?: Nullable<number> }): string => {
  if (show.episode === null) {
    return 'null';
  }

  const range = typeof show.parts === 'number' && show.parts > 1 ? `-${show.episode + (show.parts - 1)}` : '';
  return `${show.episode}${range}`;
};

export const seasonEpisodeToString = (show: { season: Nullable<number>; episode: Nullable<number>; parts?: Nullable<number> }): string => {
  if (show.season === null || show.episode === null) {
    return 'null';
  }

  return `S${show.season}E${episodeToString(show)}`;
};

const pad = (value: number) => String(value).padStart(2, '0');

/** The heading of a show's page: `S01 E01: Title` for episodes (`E01-02` for double ones), the plain title for everything else */
export const formatShowHeading = (show: {
  type: string;
  season: Nullable<number>;
  episode: Nullable<number>;
  parts?: Nullable<number>;
  title: string;
}): string => {
  if (show.type !== 'episode' || show.season === null || show.episode === null) return show.title;
  const last = typeof show.parts === 'number' && show.parts > 1 ? `-${pad(show.episode + show.parts - 1)}` : '';
  return `S${pad(show.season)} E${pad(show.episode)}${last}: ${show.title}`;
};
