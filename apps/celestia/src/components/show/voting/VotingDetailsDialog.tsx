import { useTranslations } from 'next-intl';
import { FC } from 'react';
import { Button, Modal, ModalBody, ModalFooter, ModalHeader, Progress } from 'reactstrap';

import { GetShowIdVoteResult } from '@mlp-vectorclub/api-types';
import InlineIcon from 'src/components/shared/InlineIcon';
import { useShowVotes } from 'src/hooks';
import { Status } from 'src/types';

interface PropTypes {
  showId: number;
  isOpen: boolean;
  onClose: () => void;
  initialVotes?: GetShowIdVoteResult;
}

const SCORES = [1, 2, 3, 4, 5];

/** The vote totals. Only mounted while open, so the numbers are not fetched or rendered until somebody asks for them */
const Totals: FC<Pick<PropTypes, 'showId' | 'initialVotes'>> = ({ showId, initialVotes }) => {
  const t = useTranslations();
  const { votes, status } = useShowVotes({ id: showId }, initialVotes);

  if (!votes) {
    return status === Status.FAILURE ? (
      <p className="text-danger mb-0">{t('show.voting.detailsFailed')}</p>
    ) : (
      <p className="mb-0">
        <InlineIcon loading first />
        {t('show.voting.detailsLoading')}
      </p>
    );
  }

  const total = SCORES.reduce((sum, score) => sum + (votes[String(score)] ?? 0), 0);
  return (
    <>
      <p>{t('show.voting.detailsIntro')}</p>
      <ul className="list-unstyled mb-2">
        {SCORES.map((score) => {
          const count = votes[String(score)] ?? 0;
          return (
            <li key={score} className="mb-1">
              <strong>{t('show.voting.muffinsLabel', { count: score })}:</strong> {t('show.voting.votes', { count })}
              <Progress
                value={total === 0 ? 0 : (count / total) * 100}
                className="mt-1"
                aria-label={t('show.voting.muffinsLabel', { count: score })}
              />
            </li>
          );
        })}
      </ul>
      <small className="text-muted">{t('show.voting.totalVotes', { count: total })}</small>
    </>
  );
};

/** "Voting details": how many votes each rating got */
export const VotingDetailsDialog: FC<PropTypes> = ({ showId, isOpen, onClose, initialVotes }) => {
  const t = useTranslations();
  return (
    <Modal className="modal-ui" centered isOpen={isOpen} toggle={onClose}>
      <ModalHeader toggle={onClose}>{t('show.voting.detailsTitle')}</ModalHeader>
      <ModalBody>
        <Totals showId={showId} initialVotes={initialVotes} />
      </ModalBody>
      <ModalFooter>
        <Button color="link" onClick={onClose}>
          {t('common.actions.close')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};
