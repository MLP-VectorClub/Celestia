import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { FC, useEffect, useRef, useState } from 'react';
import { Button } from 'reactstrap';

import { GetShowIdResult, GetShowIdVoteResult } from '@mlp-vectorclub/api-types';
import InlineIcon from 'src/components/shared/InlineIcon';
import { MuffinRating } from 'src/components/shared/MuffinRating';
import TimeAgo from 'src/components/shared/TimeAgo';
import { RateDialog } from 'src/components/show/voting/RateDialog';
import { VotingDetailsDialog } from 'src/components/show/voting/VotingDetailsDialog';
import { useAuth, useShowEntry } from 'src/hooks';
import { ENDPOINTS } from 'src/utils';

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
  const queryClient = useQueryClient();
  // The rating just cast, shown until the refetched show carries it as `userVote`
  const [castVote, setCastVote] = useState<number | null>(null);

  // `userVote` belongs to whoever was signed in when the show was fetched
  const wasSignedIn = useRef(signedIn);
  useEffect(() => {
    if (wasSignedIn.current === signedIn) return;
    wasSignedIn.current = signedIn;
    setCastVote(null);
    void queryClient.invalidateQueries({ queryKey: [ENDPOINTS.SHOW_BY_ID({ id: showId })] });
  }, [queryClient, showId, signedIn]);

  if (!show || show.type !== 'episode') return null;

  const score = show.score ? Math.round(show.score * 100) / 100 : null;
  const myVote = signedIn ? (show.userVote ?? castVote) : null;
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
              <Button className="rate" color="primary" size="sm" onClick={() => setRateOpen(true)}>
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
          <RateDialog showId={showId} isOpen={rateOpen} onClose={() => setRateOpen(false)} onVoted={setCastVote} />
        </>
      )}
    </section>
  );
};
