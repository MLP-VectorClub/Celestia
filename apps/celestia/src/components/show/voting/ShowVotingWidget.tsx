import { useTranslations } from 'next-intl';
import { FC, useState } from 'react';
import { Button } from 'reactstrap';

import { GetShowIdResult, GetShowIdVoteResult } from '@mlp-vectorclub/api-types';
import InlineIcon from 'src/components/shared/InlineIcon';
import { MuffinRating } from 'src/components/shared/MuffinRating';
import TimeAgo from 'src/components/shared/TimeAgo';
import { RateDialog } from 'src/components/show/voting/RateDialog';
import { VotingDetailsDialog } from 'src/components/show/voting/VotingDetailsDialog';
import { useAuth, useShowEntry } from 'src/hooks';

interface PropTypes {
  showId: number;
  initialShow?: GetShowIdResult;
  initialVotes?: GetShowIdVoteResult;
}

/**
 * The rating of an episode as a sidebar section, as on the old site: the average with its muffins, a way to cast a vote and a link that opens the
 * totals in a dialog. The totals themselves are not shown anywhere else.
 */
export const ShowVotingWidget: FC<PropTypes> = ({ showId, initialShow, initialVotes }) => {
  const t = useTranslations();
  const { show } = useShowEntry({ id: showId }, initialShow);
  const { signedIn } = useAuth();
  const [totalsOpen, setTotalsOpen] = useState(false);
  const [rateOpen, setRateOpen] = useState(false);
  // The API does not tell which rating the visitor gave, only what was cast in this visit is known
  const [myVote, setMyVote] = useState<number | null>(null);

  if (!show || show.type !== 'episode') return null;

  const score = show.score ? Math.round(show.score * 100) / 100 : null;
  return (
    <section id="voting">
      <h2>{t('show.voting.heading')}</h2>
      {!show.aired ? (
        <p>{t.rich('show.voting.notYetAired', { time: () => <TimeAgo date={show.willAir ?? show.airs} /> })}</p>
      ) : (
        <>
          {score === null ? (
            <p>{t('show.voting.nobodyVoted')}</p>
          ) : (
            <>
              <p className="mb-1">{t('show.voting.rated', { score })}</p>
              <p className="mb-2">
                <Button color="link" size="sm" className="p-0" onClick={() => setTotalsOpen(true)}>
                  <InlineIcon icon="chart-pie" first />
                  {t('show.voting.showTotals')}
                </Button>
              </p>
              <MuffinRating score={show.score} className="mb-2" />
            </>
          )}
          {myVote !== null ? (
            <p>{t('show.voting.yourRating', { count: myVote })}</p>
          ) : signedIn ? (
            <>
              <p>{t('show.voting.prompt')}</p>
              <Button color="primary" size="sm" onClick={() => setRateOpen(true)}>
                <InlineIcon icon="star" first />
                {t('show.voting.cast')}
              </Button>
            </>
          ) : (
            <p>
              <em>{t('show.voting.signIn')}</em>
            </p>
          )}
          <VotingDetailsDialog showId={showId} isOpen={totalsOpen} onClose={() => setTotalsOpen(false)} initialVotes={initialVotes} />
          <RateDialog showId={showId} isOpen={rateOpen} onClose={() => setRateOpen(false)} onVoted={setMyVote} />
        </>
      )}
    </section>
  );
};
