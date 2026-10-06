import classNames from 'classnames';
import { useTranslations } from 'next-intl';
import { FC } from 'react';

import { GetEventsIdResult } from '@mlp-vectorclub/api-types';
import styles from 'modules/PostList.module.scss';
import ExternalLink from 'src/components/shared/ExternalLink';
import InlineIcon from 'src/components/shared/InlineIcon';
import TimeAgo from 'src/components/shared/TimeAgo';
import UserLink from 'src/components/shared/UserLink';
import { LazyImage } from 'src/components/show/PostImages';
import { createFavMeUrl } from 'src/utils/url';

/** The submissions of an event as one wrapping row of cards, like the old site's entry list */
export const EventEntries: FC<{ entries: GetEventsIdResult['entries']; isStaff: boolean }> = ({ entries, isStaff }) => {
  const t = useTranslations();

  return (
    <ul className={styles.list}>
      {entries.map((entry) => {
        // The old site linked the title for DeviantArt submissions, and for staff whatever the provider
        const titleHref =
          entry.submissionProvider === 'fav.me'
            ? createFavMeUrl(entry.submissionId)
            : isStaff
              ? `http://${entry.submissionProvider}/${entry.submissionId}`
              : null;
        return (
          <li key={entry.id} id={`entry-${entry.id}`} className={classNames(styles.card)}>
            {entry.previewUrl && (
              <div className={styles.image}>
                <a href={entry.fullUrl ?? entry.previewUrl} target="_blank" rel="noopener noreferrer">
                  <LazyImage src={entry.previewUrl} alt={t('events.details.entryPreview')} />
                </a>
              </div>
            )}
            <strong className="d-block my-1">
              {titleHref ? <ExternalLink href={titleHref}>{entry.title}</ExternalLink> : entry.title}
            </strong>
            <div>
              <InlineIcon icon="user" first title={t('events.details.by')} />
              <UserLink id={entry.submittedBy.id} name={entry.submittedBy.name} />
            </div>
            <div>
              <InlineIcon icon="clock" first title={t('events.details.submitted')} />
              <TimeAgo date={entry.createdAt} />
            </div>
            {entry.updatedAt !== entry.createdAt && (
              <div>
                <InlineIcon icon="pencil-alt" first title={t('events.details.lastEdited')} />
                <TimeAgo date={entry.updatedAt} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
};
