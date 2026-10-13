import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { FC, useState } from 'react';

import { ShowListItem } from '@mlp-vectorclub/api-types';
import InlineIcon from 'src/components/shared/InlineIcon';
import { LocalTime } from 'src/components/shared/LocalTime';
import { ShowRowActions } from 'src/components/show/ShowRowActions';
import { useAuth } from 'src/hooks';
import { useLatestShowId } from 'src/hooks/content';
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
  const latestId = useLatestShowId();
  const typeName = t(`show.index.typeNames.${entry.type}`);
  // The same markers as on the old site: the entry the homepage shows, and one that has not aired yet (so it cannot be voted on)
  const [now] = useState(() => Date.now());
  const notAired = entry.airs === null || new Date(entry.airs).getTime() > now;
  return (
    <>
      <div>
        {latestId === entry.id && <InlineIcon icon="home" first title={t('show.index.onHomepage')} />}
        {notAired && <InlineIcon icon="chart-pie" first title={t('show.index.notAired', { typeName })} />}
        <Link href={PATHS.EPISODE(entry)}>{entry.title}</Link>
        {isStaff && <ShowRowActions entry={entry} />}
      </div>
      {entry.airs && <LocalTime date={entry.airs} format={airDateFormat} />}
    </>
  );
};
