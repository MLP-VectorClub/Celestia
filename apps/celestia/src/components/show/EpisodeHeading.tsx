import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { FC } from 'react';
import { Button } from 'reactstrap';

import { GetShowIdAdjacentResult, ShowListItem } from '@mlp-vectorclub/api-types';
import styles from 'modules/ShowEntry.module.scss';
import InlineIcon from 'src/components/shared/InlineIcon';
import { useShowAdjacent } from 'src/hooks';
import { PATHS } from 'src/paths';
import { Nullable } from 'src/types';
import { formatShowHeading } from 'src/utils/show';

interface PropTypes {
  show: ShowListItem;
  initialAdjacent?: Nullable<GetShowIdAdjacentResult>;
  /** Added-by line for staff */
  addedBy?: React.ReactNode;
}

const AdjacentButton: FC<{ entry: ShowListItem; direction: 'previous' | 'next' }> = ({ entry, direction }) => (
  <Button tag={Link} href={PATHS.EPISODE(entry)} color="guide-link" title={entry.title} className="ep-button">
    {direction === 'previous' && <InlineIcon icon="backward" first />}
    <span>{entry.title}</span>
    {direction === 'next' && <InlineIcon icon="forward" last />}
  </Button>
);

/** The top of a show's page: the previous and next entry as buttons on both sides of the title */
export const EpisodeHeading: FC<PropTypes> = ({ show, initialAdjacent, addedBy }) => {
  const t = useTranslations();
  const adjacent = useShowAdjacent({ id: show.id }, initialAdjacent || undefined);
  return (
    <div className={styles.headingWrap}>
      <div className={`${styles.side} ${styles.prev}`}>{adjacent?.previous && <AdjacentButton entry={adjacent.previous} direction="previous" />}</div>
      <div className={styles.main}>
        <h1 className="page-heading">{formatShowHeading(show)}</h1>
        <div className="lead page-lead">{t('show.entry.subtitle')}</div>
        {addedBy}
      </div>
      <div className={`${styles.side} ${styles.next}`}>{adjacent?.next && <AdjacentButton entry={adjacent.next} direction="next" />}</div>
    </div>
  );
};
