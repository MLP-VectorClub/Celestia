import { format } from 'date-fns';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FC, useMemo, useState } from 'react';
import { Button, Progress } from 'reactstrap';

import { GetPostsResult, GetShowIdResult, GetShowIdVoteResult } from '@mlp-vectorclub/api-types';
import { AppearanceLink } from 'src/components/colorguide/AppearanceLink';
import Content from 'src/components/shared/Content';
import { MuffinRating } from 'src/components/shared/MuffinRating';
import StandardHeading from 'src/components/shared/StandardHeading';
import StatusAlert from 'src/components/shared/StatusAlert';
import { useDialog } from 'src/components/shared/dialogs/DialogProvider';
import { PostList } from 'src/components/show/PostList';
import { ShowFormDialog } from 'src/components/show/ShowFormDialog';
import { describeApiError, useApiMutation, useAuth, useShowEntry, useShowVotes, useTitleSetter } from 'src/hooks';
import { PATHS } from 'src/paths';
import { PostService } from 'src/services/posts';
import { ShowAdminService } from 'src/services/show-admin';
import { useAppDispatch } from 'src/store';
import { Nullable, Translatable } from 'src/types';
import { ShowEntry } from 'src/types/api-alias';
import { TitleFactory } from 'src/types/title';
import { ENDPOINTS } from 'src/utils';
import { seasonEpisodeToString } from 'src/utils/show';

export interface ShowEntryPageProps {
  id: number;
  initialShow: Nullable<GetShowIdResult>;
  initialRequests: Nullable<GetPostsResult>;
  initialReservations: Nullable<GetPostsResult>;
  initialVotes: Nullable<GetShowIdVoteResult>;
}

export const showTitleFactory: TitleFactory<{ show: Nullable<ShowEntry> }> = ({ show }) => {
  const label: string | Translatable = show ? show.title : ['show.entry.notFound'];
  return {
    title: label,
    breadcrumbs: [
      { linkProps: { href: PATHS.SHOW }, label: ['common.titles.show'] },
      { label, active: true },
    ],
  };
};

const VoteForm: FC<{ showId: number }> = ({ showId }) => {
  const t = useTranslations();
  const vote = useApiMutation((score: number) => PostService.vote(showId, score), { invalidate: [[ENDPOINTS.SHOW_VOTE({ id: showId })]] });
  if (vote.isSuccess) return <p className="text-success">{t('show.entry.thanksForVoting')}</p>;
  return (
    <div className="mb-3">
      <span className="me-2">{t('show.entry.rate')}</span>
      {[1, 2, 3, 4, 5].map((score) => (
        <Button key={score} size="sm" color="primary" outline className="me-1" onClick={() => vote.mutate(score)} disabled={vote.isPending}>
          {score}
        </Button>
      ))}
      {vote.error && <p className="text-danger mt-1 mb-0">{describeApiError(vote.error)}</p>}
    </div>
  );
};

const VoteResults: FC<{ votes: Record<string, number> }> = ({ votes }) => {
  const t = useTranslations();
  const total = Object.values(votes).reduce((sum, n) => sum + n, 0);
  if (total === 0) return <p className="text-muted">{t('show.entry.noVotes')}</p>;
  return (
    <div>
      {[5, 4, 3, 2, 1].map((score) => {
        const count = votes[String(score)] ?? 0;
        return (
          <div key={score} className="d-flex align-items-center mb-1">
            <span className="me-2" style={{ width: '5rem' }}>
              {t('show.entry.scoreLabel', { score })}
            </span>
            <Progress value={(count / total) * 100} className="flex-grow-1 me-2" />
            <span>{count}</span>
          </div>
        );
      })}
      <small className="text-muted">{t('show.entry.voteCount', { count: total })}</small>
    </div>
  );
};

export const ShowEntryPage: FC<ShowEntryPageProps> = ({ id, initialShow, initialRequests, initialReservations, initialVotes }) => {
  const t = useTranslations();
  const dispatch = useAppDispatch();
  const { show, status } = useShowEntry({ id }, initialShow || undefined);
  const { votes } = useShowVotes({ id }, initialVotes || undefined);
  const { signedIn } = useAuth();
  const { confirm } = useDialog();
  const { push, replace } = useRouter();
  const [editing, setEditing] = useState(false);
  const remove = useApiMutation(() => ShowAdminService.remove(id), { onSuccess: () => void push(PATHS.SHOW) });

  const titleData = useMemo(() => showTitleFactory({ show: show || null }), [show]);
  useTitleSetter(dispatch, titleData);

  if (!show) {
    return (
      <Content>
        <StandardHeading heading={t('show.entry.notFound')} lead={t('show.entry.checkYourSpelling')} />
        <StatusAlert status={status} subject={t('show.entry.loadingSubject')} />
      </Content>
    );
  }

  const code = show.type === 'episode' ? seasonEpisodeToString(show) : null;
  return (
    <Content>
      <StandardHeading
        heading={show.title}
        lead={
          <>
            {code && `${code} · `}
            <time dateTime={show.airs}>
              {show.aired ? t('show.entry.aired') : t('show.entry.willAir')}{' '}
              {format(new Date(show.airs ?? show.willAir), t('show.index.airDateFormat'))}
            </time>
          </>
        }
      />
      {show.notes && <p className="text-center">{show.notes}</p>}

      {show.canEdit && (
        <div className="mb-3 d-flex flex-wrap gap-2 justify-content-center">
          <Button color="ui" size="sm" onClick={() => setEditing(true)}>
            {t('show.admin.edit')}
          </Button>
          <Button
            color="danger"
            size="sm"
            outline
            disabled={remove.isPending}
            onClick={async () => {
              if (
                await confirm({
                  title: t('show.admin.deleteTitle'),
                  body: t('show.admin.deleteBody', { title: show.title }),
                  color: 'danger',
                  confirmLabel: t('show.admin.delete'),
                })
              ) {
                remove.mutate();
              }
            }}
          >
            {t('show.admin.delete')}
          </Button>
          {remove.error && <p className="text-danger w-100 text-center mb-0">{describeApiError(remove.error)}</p>}
          <ShowFormDialog
            category={show.type === 'episode' ? 'episode' : 'other'}
            show={show}
            isOpen={editing}
            onClose={() => setEditing(false)}
            onSaved={(path) => {
              setEditing(false);
              void replace(path);
            }}
          />
        </div>
      )}

      <section>
        <h2>{t('show.entry.relatedAppearances')}</h2>
        {show.relatedAppearances.length === 0 ? (
          <p className="text-muted">{t('show.entry.noRelatedAppearances')}</p>
        ) : (
          <ul className="list-unstyled">
            {show.relatedAppearances.map((appearance) => (
              <li key={appearance.id}>
                <AppearanceLink {...appearance} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {show.aired && show.type === 'episode' && votes && (
        <section>
          <h2>{t('show.entry.votes')}</h2>
          <MuffinRating score={show.score} className="mb-2" />
          {signedIn && <VoteForm showId={id} />}
          <VoteResults votes={votes} />
        </section>
      )}

      <PostList showId={id} kind="request" initialData={initialRequests || undefined} />
      <PostList showId={id} kind="reservation" initialData={initialReservations || undefined} />

      <Link href={PATHS.SHOW}>{t('show.entry.backToList')}</Link>
    </Content>
  );
};
