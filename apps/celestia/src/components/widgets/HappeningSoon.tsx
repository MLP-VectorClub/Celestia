import { addMonths, differenceInSeconds, format, formatDistanceToNowStrict } from 'date-fns';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { FC, useEffect, useState } from 'react';

import { ShowListItem } from '@mlp-vectorclub/api-types';
import styles from 'modules/HappeningSoon.module.scss';
import { useUpcomingShows } from 'src/hooks';
import { PATHS } from 'src/paths';

const ALLOWED_PREFIXES: Record<string, string> = { 'Equestria Girls': 'EQG', 'My Little Pony': 'MLP' };
const pad = (value: number) => String(value).padStart(2, '0');

/** `Equestria Girls: Rainbow Rocks` becomes `EQG: Rainbow Rocks`, other prefixes stay, entries without one get their type in front */
const upcomingTitle = (show: ShowListItem): string => {
  if (show.type === 'episode') return show.title;
  const prefix = /^\s*(.*?[^\\]):\s*/.exec(show.title);
  if (prefix) return ALLOWED_PREFIXES[prefix[1]] ? `${ALLOWED_PREFIXES[prefix[1]]}: ${show.title.replace(prefix[0], '')}` : show.title;
  return `${show.type.charAt(0).toUpperCase()}${show.type.slice(1)}: ${show.title}`;
};

/** The time until the first entry airs, counted down every second like the old site ("in 2 days & 3:04:05"), and a plain "in 3 weeks" for the others and for far away ones */
const AirsIn: FC<{ airs: Date; live: boolean }> = ({ airs, live }) => {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    if (!live) return;
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, [live]);
  // The server has no clock of the visitor, so the text appears after hydration
  if (!now) return <time dateTime={airs.toISOString()}>{format(airs, 'PPp')}</time>;

  const seconds = differenceInSeconds(airs, now);
  let text: string;
  if (live && seconds > 0 && airs < addMonths(now, 1)) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    text = `in ${days > 0 ? `${days} day${days !== 1 ? 's' : ''} & ` : ''}${hours > 0 ? `${hours}:` : ''}${pad(minutes)}:${pad(seconds % 60)}`;
  } else {
    text = seconds > 0 ? `in ${formatDistanceToNowStrict(airs)}` : `${formatDistanceToNowStrict(airs)} ago`;
  }
  return (
    <time dateTime={airs.toISOString()} title={format(airs, 'PPPPpp')}>
      {text}
    </time>
  );
};

/** The sidebar list of shows that air within the next 6 months, hidden when there are none */
const HappeningSoon: FC = () => {
  const t = useTranslations();
  const shows = useUpcomingShows();
  if (shows.length === 0) return null;

  return (
    <section id="upcoming">
      <h2>{t('common.sidebar.happeningSoon')}</h2>
      <ul className={styles.list}>
        {shows.map((show, index) => {
          const airs = new Date(show.airs ?? 0);
          return (
            <li key={show.id}>
              <div className={styles.calendar}>
                <span className={`${styles.top} ${show.type === 'episode' ? '' : styles.movie}`}>{format(airs, 'MMM')}</span>
                <span className={styles.bottom}>{format(airs, 'd')}</span>
              </div>
              <div className={styles.meta}>
                <span className="title">
                  <Link href={PATHS.EPISODE(show)}>{upcomingTitle(show)}</Link>
                </span>
                <span className={styles.time}>
                  {t('common.sidebar.airs')} <AirsIn airs={airs} live={index === 0} />
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default HappeningSoon;
