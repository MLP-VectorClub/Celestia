import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FC, useMemo, useState } from 'react';
import { Button } from 'reactstrap';

import { GetPostsResult, GetShowIdAdjacentResult, GetShowIdResult, GetShowIdVoteResult, GetShowReservationInfoResult } from '@mlp-vectorclub/api-types';
import styles from 'modules/ShowEntry.module.scss';
import { AppearanceLink } from 'src/components/colorguide/AppearanceLink';
import Content from 'src/components/shared/Content';
import StandardHeading from 'src/components/shared/StandardHeading';
import StatusAlert from 'src/components/shared/StatusAlert';
import { useDialog } from 'src/components/shared/dialogs/DialogProvider';
import { EpisodeHeading } from 'src/components/show/EpisodeHeading';
import { PostList } from 'src/components/show/PostList';
import { ReservationTexts } from 'src/components/show/ReservationTexts';
import { RibbonHeading } from 'src/components/show/RibbonHeading';
import { ShowAppearancesDialog } from 'src/components/show/ShowAppearancesDialog';
import { ShowFormDialog } from 'src/components/show/ShowFormDialog';
import { ShowVotingWidget } from 'src/components/show/voting/ShowVotingWidget';
import { describeApiError, useApiMutation, useShowEntry, useSidebarWidget, useTitleSetter } from 'src/hooks';
import { PATHS } from 'src/paths';
import { ShowAdminService } from 'src/services/show-admin';
import { useAppDispatch } from 'src/store';
import { Nullable, Translatable } from 'src/types';
import { ShowEntry } from 'src/types/api-alias';
import { TitleFactory } from 'src/types/title';

export interface ShowEntryPageProps {
  id: number;
  initialShow: Nullable<GetShowIdResult>;
  initialRequests: Nullable<GetPostsResult>;
  initialReservations: Nullable<GetPostsResult>;
  initialVotes: Nullable<GetShowIdVoteResult>;
  initialAdjacent?: Nullable<GetShowIdAdjacentResult>;
  initialReservationInfo?: Nullable<GetShowReservationInfoResult>;
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

export const ShowEntryPage: FC<ShowEntryPageProps> = ({
  id,
  initialShow,
  initialRequests,
  initialReservations,
  initialVotes,
  initialAdjacent,
  initialReservationInfo,
}) => {
  const t = useTranslations();
  const dispatch = useAppDispatch();
  const { show, status } = useShowEntry({ id }, initialShow || undefined);
  const { confirm } = useDialog();
  const { push, replace } = useRouter();
  const [editing, setEditing] = useState(false);
  const [relating, setRelating] = useState(false);
  const remove = useApiMutation(() => ShowAdminService.remove(id), { onSuccess: () => void push(PATHS.SHOW) });

  const titleData = useMemo(() => showTitleFactory({ show: show || null }), [show]);
  useTitleSetter(dispatch, titleData);

  // The rating lives in the sidebar, as on the old site
  const isEpisode = show?.type === 'episode';
  const votingWidget = useMemo(
    () =>
      isEpisode ? <ShowVotingWidget showId={id} initialShow={initialShow || undefined} initialVotes={initialVotes || undefined} /> : null,
    [id, initialShow, initialVotes, isEpisode]
  );
  useSidebarWidget(votingWidget);

  if (!show) {
    return (
      <Content>
        <StandardHeading heading={t('show.entry.notFound')} lead={t('show.entry.checkYourSpelling')} />
        <StatusAlert status={status} subject={t('show.entry.loadingSubject')} />
      </Content>
    );
  }

  return (
    <Content>
      <EpisodeHeading show={show} initialAdjacent={initialAdjacent} />

      <ReservationTexts initial={initialReservationInfo} />

      {show.notes && (
        <section className={`${styles.section} ${styles.ui} ${styles.notes} notes`}>
          <RibbonHeading color="ui">{t('show.entry.notesHeading')}</RibbonHeading>
          <pre>{show.notes}</pre>
        </section>
      )}

      {show.relatedAppearances.length > 0 && (
        <section className={`${styles.section} ${styles.green} ${styles.related} appearances`}>
          <RibbonHeading color="green">
            {t.rich('show.entry.relatedHeading', {
              count: show.relatedAppearances.length,
              guide: (chunks) => <Link href={PATHS.GUIDE_INDEX}>{chunks}</Link>,
            })}
          </RibbonHeading>
          <ul>
            {show.relatedAppearances.map((appearance) => (
              <li key={appearance.id}>
                <AppearanceLink {...appearance} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {show.canEdit && (
        <section className={`${styles.section} ${styles.darkblue} admin`}>
          <RibbonHeading color="darkblue">{t('show.entry.adminHeading')}</RibbonHeading>
          <div className="d-flex flex-wrap gap-2 justify-content-center mb-3">
            <Button color="primary" id="edit-show" onClick={() => setEditing(true)}>
              {t('show.entry.metadata')}
            </Button>
            <Button color="primary" id="cg-relations" onClick={() => setRelating(true)}>
              {t('show.entry.guideRelations')}
            </Button>
            <ShowAppearancesDialog showId={id} isOpen={relating} onClose={() => setRelating(false)} />
            <Button
              color="danger"
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
        </section>
      )}

      <PostList showId={id} kind="reservation" initialData={initialReservations || undefined} />
      <PostList showId={id} kind="request" initialData={initialRequests || undefined} />

      <Link href={PATHS.SHOW}>{t('show.entry.backToList')}</Link>
    </Content>
  );
};
