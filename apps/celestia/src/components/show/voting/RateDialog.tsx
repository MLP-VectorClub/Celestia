import { useTranslations } from 'next-intl';
import { FC, useEffect, useState } from 'react';

import { FormDialog } from 'src/components/shared/dialogs/FormDialog';
import { MuffinSelector } from 'src/components/show/voting/MuffinSelector';
import { describeApiError, useApiMutation } from 'src/hooks';
import { PostService } from 'src/services/posts';
import { ENDPOINTS } from 'src/utils';

interface PropTypes {
  showId: number;
  isOpen: boolean;
  onClose: () => void;
  /** Called with the rating once it was saved */
  onVoted: (score: number) => void;
}

/** "Rate this episode": pick one to five muffins, which cannot be changed later */
export const RateDialog: FC<PropTypes> = ({ showId, isOpen, onClose, onVoted }) => {
  const t = useTranslations();
  const [score, setScore] = useState<number | null>(null);
  const [preview, setPreview] = useState<number | null>(null);
  const [missing, setMissing] = useState(false);

  const vote = useApiMutation((value: number) => PostService.vote(showId, value), {
    invalidate: [[ENDPOINTS.SHOW_VOTE({ id: showId })], [ENDPOINTS.SHOW_BY_ID({ id: showId })]],
    onSuccess: (_data, value) => {
      onVoted(value);
      onClose();
    },
  });

  useEffect(() => {
    if (isOpen) return;
    setScore(null);
    setPreview(null);
    setMissing(false);
    vote.reset();
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = () => {
    if (score === null) return setMissing(true);
    vote.mutate(score);
  };
  const error = missing && score === null ? t('show.voting.chooseRating') : vote.error ? describeApiError(vote.error) : null;

  return (
    <FormDialog
      title={t('show.voting.rateTitle')}
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={submit}
      submitLabel={t('show.voting.rateSubmit')}
      submitTestId="dialog-btn-rate"
      busy={vote.isPending}
      error={error}
    >
      <p>{t('show.voting.rateHelp')}</p>
      <div className="text-center">
        <MuffinSelector
          label={t('show.voting.ratingGroup')}
          value={score}
          onChange={(value) => {
            setScore(value);
            setMissing(false);
          }}
          onPreview={setPreview}
        />
        <p className="mt-2 mb-0" aria-live="polite">
          {t.rich('show.voting.yourRatingPreview', {
            score: (preview ?? score)?.toString() ?? '?',
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
        </p>
      </div>
    </FormDialog>
  );
};
