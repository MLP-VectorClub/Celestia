import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { FC } from 'react';

import { ShowListItem } from '@mlp-vectorclub/api-types';
import { LocalTime } from 'src/components/shared/LocalTime';
import { ShowRowActions } from 'src/components/show/ShowRowActions';
import { useAuth } from 'src/hooks';
import { PATHS } from 'src/paths';
import { ShowTableColumnDefinition } from 'src/types/show';
import { episodeToString, seasonEpisodeToString } from 'src/utils/show';

export const EpisodeColumn: ShowTableColumnDefinition['renderContent'] = ({ entry }) => <>{episodeToString(entry)}</>;

export const SeasonColumn: ShowTableColumnDefinition['renderContent'] = ({ entry }) => <>{entry.season}</>;

export const EpisodeNumberColumn: ShowTableColumnDefinition['renderContent'] = ({ entry }) => <>{seasonEpisodeToString(entry)}</>;

export const ShowNumberColumn: ShowTableColumnDefinition['renderContent'] = ({ entry }) => <>{entry.no}</>;

export const TitleAirDateColumn: FC<{ entry: ShowListItem }> = ({ entry }) => {
  const t = useTranslations();
  const { isStaff } = useAuth();
  const airDateFormat = t(`show.index.airDateFormat`);
  return (
    <>
      <div>
        <Link href={PATHS.EPISODE(entry)}>{entry.title}</Link>
        {isStaff && <ShowRowActions entry={entry} />}
      </div>
      {entry.airs && <LocalTime date={entry.airs} format={airDateFormat} />}
    </>
  );
};
