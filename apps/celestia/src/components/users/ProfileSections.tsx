import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import pluralize from 'pluralize';
import { FC, ReactNode, useState } from 'react';
import { Alert, Button, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';

import { PostItem, ShowListItem, UserProfile } from '@mlp-vectorclub/api-types';
import postStyles from 'modules/PostList.module.scss';
import styles from 'modules/ProfilePage.module.scss';
import { AppearancePreview } from 'src/components/colorguide/AppearancePreview';
import ExternalLink from 'src/components/shared/ExternalLink';
import InlineIcon from 'src/components/shared/InlineIcon';
import TimeAgo from 'src/components/shared/TimeAgo';
import { useDialog } from 'src/components/shared/dialogs/DialogProvider';
import { PostImageDialog } from 'src/components/show/PostImageDialog';
import { DeviationImage, ScreencapImage } from 'src/components/show/PostImages';
import { GivePointsDialog } from 'src/components/users/GivePointsDialog';
import { RequestRouletteDialog } from 'src/components/users/RequestRouletteDialog';
import { describeApiError, useApiMutation, useAuth } from 'src/hooks';
import { PATHS } from 'src/paths';
import { PostService } from 'src/services/posts';
import { UserAdminService } from 'src/services/user-admin';
import { ENDPOINTS } from 'src/utils';
import { permission } from 'src/utils/permission';
import { formatShowId } from 'src/utils/show';

type PropTypes = { profile: UserProfile };
type ProfilePost = PostItem & { show: ShowListItem };

const LINKED_CONTRIBUTIONS = ['cms-provided', 'requests', 'reservations', 'finished-posts', 'fulfilled-requests'];

/** Marks who sees a section, in front of its heading (for the user's own profile, as on the old site) */
const Privacy: FC<{ level: 'public' | 'staff' }> = ({ level }) => {
  const t = useTranslations();
  return (
    <span className={styles.privacy} title={t(`users.profile.visibleTo.${level}`)}>
      <InlineIcon icon={level === 'public' ? 'globe' : 'lock'} className={level === 'public' ? 'text-primary' : undefined} />
    </span>
  );
};

export const ProfilePreviousNames: FC<PropTypes> = ({ profile }) => {
  const t = useTranslations();
  if (!profile.previousUsernames || profile.previousUsernames.length === 0) return null;
  return (
    <section className="old-names">
      <h2>
        {profile.sameUser && <Privacy level="staff" />}
        {t('users.profile.oldNames')} <InlineIcon icon="info" size="sm" className="text-primary" title={t('users.profile.oldNamesHint')} />
      </h2>
      <div>{profile.previousUsernames.join(', ')}</div>
    </section>
  );
};

export const ProfileContributions: FC<PropTypes> = ({ profile }) => {
  const t = useTranslations();
  const { isStaff } = useAuth();
  const queryClient = useQueryClient();
  const purge = useApiMutation(() => UserAdminService.purgeContributionsCache(profile.user.id), {
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [ENDPOINTS.USER_PROFILE({ id: profile.user.id })] }),
  });
  if (profile.contributions.length === 0) return null;
  return (
    <section className={`contributions ${styles.contributions}`}>
      <h2>
        {profile.sameUser && <Privacy level="public" />}
        {t('users.profile.contributions')}{' '}
        <InlineIcon icon="info" size="sm" className="text-primary" title={t('users.profile.contributionsHint', { duration: profile.contributionsCacheDuration })} />
        {isStaff && (
          <Button color="link" size="sm" id="purge-contrib-cache" title={t('users.profile.purgeCache')} aria-label={t('users.profile.purgeCache')} disabled={purge.isPending} onClick={() => purge.mutate()}>
            <InlineIcon icon="sync" />
          </Button>
        )}
      </h2>
      <ul>
        {profile.contributions.map((c) => {
          const text = (
            <>
              <span className="amt">{c.count}</span> <span className="expl">{pluralize(c.noun, c.count)} {c.verb}</span>
            </>
          );
          const linked = LINKED_CONTRIBUTIONS.includes(c.type) && (c.type !== 'requests' || profile.sameUser || isStaff);
          return <li key={c.type}>{linked ? <Link href={PATHS.USER_CONTRIB(profile.user.id, c.type)}>{text}</Link> : text}</li>;
        })}
      </ul>
    </section>
  );
};

const PersonalGuideAbout: FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const t = useTranslations();
  return (
    <Modal className="modal-ui" centered isOpen={isOpen} toggle={onClose}>
      <ModalHeader toggle={onClose}>{t('users.profile.pcgAbout.title')}</ModalHeader>
      <ModalBody>
        <p>{t.rich('users.pcgAbout.p1', { guide: (c) => <Link href={PATHS.GUIDE_INDEX}>{c}</Link> })}</p>
        <p>
          {t.rich('users.pcgAbout.p2', {
            group: (c) => <ExternalLink href="https://www.deviantart.com/mlp-vectorclub">{c}</ExternalLink>,
            em: (c) => <em>{c}</em>,
          })}
        </p>
        <p>{t.rich('users.pcgAbout.p3', { strong: (c) => <strong>{c}</strong> })}</p>
        <ul>
          <li>{t('users.pcgAbout.l1')}</li>
          <li>{t('users.pcgAbout.l2')}</li>
          <li>{t('users.pcgAbout.l3')}</li>
          <li>{t('users.pcgAbout.l4')}</li>
        </ul>
      </ModalBody>
      <ModalFooter>
        <Button color="link" onClick={onClose}>
          {t('users.profile.pcgAbout.close')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export const ProfilePersonalGuides: FC<PropTypes> = ({ profile }) => {
  const t = useTranslations();
  const { isStaff } = useAuth();
  const [aboutOpen, setAboutOpen] = useState(false);
  const [givingPoints, setGivingPoints] = useState(false);
  const showPrivate = profile.sameUser || isStaff;
  const progress = profile.personalGuideProgress;
  if (profile.personalGuides === null && !showPrivate) return null;
  const guides = profile.personalGuides ?? [];

  return (
    <section className="personal-cg">
      <h2>
        {profile.sameUser && <Privacy level={profile.personalGuides === null ? 'staff' : 'public'} />}
        {t('users.profile.personalGuide')}
        {profile.sameUser && (
          <Button color="darkblue" size="sm" className="ms-2 personal-cg-say-what" onClick={() => setAboutOpen(true)}>
            <InlineIcon icon="info" first />
            {t('users.profile.pcgWhat')}
          </Button>
        )}
      </h2>
      {showPrivate && progress && (
        <p className="personal-cg-progress">
          {t(profile.sameUser ? 'users.profile.pcgProgressYou' : 'users.profile.pcgProgressUser', { slots: progress.slots ?? 0, requests: progress.requestsToNext ?? 10 })}
        </p>
      )}
      {profile.personalGuides === null && <p className="text-muted">{t('users.profile.personalGuidePrivate')}</p>}
      {(profile.sameUser || guides.length > 0) && (
        <ul className={styles.pcgList}>
          {guides.length > 0 ? (
            guides.map((a) => (
              <li key={a.id}>
                <span className="me-1 d-inline-block align-middle" style={{ width: 16, height: 16 }}>
                  <AppearancePreview data={a.previewData} className="w-100 h-100" />
                </span>
                <Link href={PATHS.PCG_APPEARANCE(profile.user.id, a)}>{a.private && !showPrivate ? t('users.profile.private') : a.label}</Link>
              </li>
            ))
          ) : (
            <li>{t('users.profile.pcgEmptyOwn')}</li>
          )}
        </ul>
      )}
      <div className="d-flex flex-wrap gap-1 mb-2">
        <Button tag={Link} href={PATHS.USER_PCG(profile.user.id)} color="guide-link" size="sm">
          <InlineIcon icon="arrow-right" first />
          {t(profile.sameUser ? 'users.profile.pcgManage' : 'users.profile.pcgView')}
        </Button>
        {showPrivate && (
          <Button tag={Link} href={PATHS.USER_PCG_POINT_HISTORY(profile.user.id)} color="guide-link" size="sm">
            <InlineIcon icon="file-alt" first />
            {t('users.profile.pcgHistory')}
          </Button>
        )}
        {isStaff && (
          <>
            <Button color="darkblue" size="sm" id="give-pcg-points" onClick={() => setGivingPoints(true)}>
              <InlineIcon icon="plus" first />
              {t('users.profile.pcgGive')}
            </Button>
            <GivePointsDialog profile={profile} isOpen={givingPoints} onClose={() => setGivingPoints(false)} />
          </>
        )}
      </div>
      <PersonalGuideAbout isOpen={aboutOpen} onClose={() => setAboutOpen(false)} />
    </section>
  );
};

/** A request or reservation on a profile: image, description, where it was posted and what can be done with it */
const ProfilePostCard: FC<{ post: ProfilePost; actions: ReactNode; deviation?: boolean }> = ({ post, actions, deviation = false }) => {
  const t = useTranslations();
  const finishedDeviation = deviation && post.deviationId;
  return (
    <li id={`post-${post.id}`} className={`${postStyles.card} ${post.broken ? postStyles.broken : ''}`}>
      {finishedDeviation ? <DeviationImage post={post} deviationId={post.deviationId as string} /> : <ScreencapImage post={post} />}
      {post.label && <span className={postStyles.label}>{post.label}</span>}
      <em className={postStyles.infoLine}>
        {t(post.kind === 'request' && post.reservedAt && !deviation ? 'users.profile.reservedUnder' : 'users.profile.postedUnder')}{' '}
        <Link href={PATHS.EPISODE(post.show)} title={post.show.title}>
          {formatShowId(post.show)}
        </Link> <TimeAgo date={(!deviation && post.kind === 'request' && post.reservedAt) || post.postedAt} />
      </em>
      {post.overdue && (
        <strong className={`${postStyles.note} ${postStyles.contest}`} title={t('show.post.contestHint')}>
          <InlineIcon icon="info-circle" first />
          {t('show.post.canBeContested')}
        </strong>
      )}
      {post.broken && (
        <strong className={`${postStyles.note} ${postStyles.brokenNote}`} title={t('show.post.brokenHint')}>
          <InlineIcon icon="plug" first />
          {t('show.post.deemedBroken')}
        </strong>
      )}
      <div className={postStyles.actions}>{actions}</div>
    </li>
  );
};

const postAddress = (post: PostItem) => `/s/${post.id.toString(36)}`;

export const ProfilePendingReservations: FC<PropTypes> = ({ profile }) => {
  const t = useTranslations();
  const { confirm } = useDialog();
  const queryClient = useQueryClient();
  const [fixing, setFixing] = useState<PostItem | null>(null);
  const [roulette, setRoulette] = useState(false);
  const posts = profile.pendingReservations as ProfilePost[] | null | undefined;
  const refresh = () => void queryClient.invalidateQueries({ queryKey: [ENDPOINTS.USER_PROFILE({ id: profile.user.id })] });
  const cancel = useApiMutation((id: number) => PostService.unreserve(id), { onSuccess: refresh });
  if (!posts) return null;

  const isMember = profile.user.role !== 'user' && profile.user.role !== null;
  const who = t(profile.sameUser ? 'users.profile.pendingYou' : 'users.profile.pendingUser');

  return (
    <section className="pending-reservations">
      <h2>
        <Privacy level="staff" />
        {t('users.profile.pendingTitle')}
        {profile.sameUser && posts.length < 4 && (
          <Button color="orange" size="sm" className="ms-2" id="suggestion" onClick={() => setRoulette(true)}>
            <InlineIcon icon="lightbulb" first />
            {t('users.profile.suggestion')}
          </Button>
        )}
      </h2>
      {isMember ? (
        <>
          <p>
            {posts.length > 0
              ? t.rich('users.profile.pendingCount', { who, count: posts.length, strong: (c) => <strong>{c}</strong> })
              : t('users.profile.pendingNone', { who })}{' '}
            {profile.sameUser && t('users.profile.pendingLimit')}
          </p>
          {posts.length > 0 && (
            <ul className={postStyles.list}>
              {posts.map((post) => (
                <ProfilePostCard
                  key={post.id}
                  post={post}
                  actions={
                    <>
                      {post.broken && (
                        <Button color="darkblue" size="sm" onClick={() => setFixing(post)}>
                          <InlineIcon icon="wrench" first />
                          {t('users.profile.fix')}
                        </Button>
                      )}
                      <Button tag={Link} href={postAddress(post)} color="blue" size="sm">
                        <InlineIcon icon="arrow-right" first />
                        {t('users.profile.view')}
                      </Button>
                      <Button
                        color="red"
                        disabled={cancel.isPending}
                        onClick={async () => {
                          if (await confirm({ title: t('users.profile.cancelTitle'), body: t('users.profile.cancelBody'), color: 'danger', confirmLabel: t('users.profile.cancel') })) {
                            cancel.mutate(post.id);
                          }
                        }}
                      >
                        <InlineIcon icon="times" first />
                        {t('users.profile.cancel')}
                      </Button>
                    </>
                  }
                />
              ))}
            </ul>
          )}
          {cancel.error && (
            <Alert color="danger" fade={false} role="alert">
              {describeApiError(cancel.error)}
            </Alert>
          )}
        </>
      ) : (
        <p>{t('users.profile.pendingNonMember')}</p>
      )}
      {fixing && <PostImageDialog post={fixing} isOpen onClose={() => { setFixing(null); refresh(); }} />}
      {roulette && <RequestRouletteDialog isOpen onClose={() => { setRoulette(false); refresh(); }} />}
    </section>
  );
};

export const ProfileAwaitingApproval: FC<PropTypes> = ({ profile }) => {
  const t = useTranslations();
  const { isStaff, user: authUser } = useAuth();
  const queryClient = useQueryClient();
  const posts = profile.awaitingApproval as ProfilePost[] | null | undefined;
  const check = useApiMutation((id: number) => PostService.approve(id), {
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [ENDPOINTS.USER_PROFILE({ id: profile.user.id })] }),
  });
  if (!posts) return null;
  const visitorIsMember = permission(authUser, 'member');
  const who = t(profile.sameUser ? 'users.profile.approvalWho' : 'users.profile.approvalWhoUser');

  return (
    <section className="awaiting-approval">
      <h2>
        {profile.sameUser && <Privacy level="public" />}
        {t('users.profile.approvalTitle')}
      </h2>
      {profile.sameUser && <p>{t('users.profile.approvalOwn')}</p>}
      {posts.length > 0 ? (
        <>
          <p>
            {t.rich('users.profile.approvalCount', { who, count: posts.length, strong: (c) => <strong>{c}</strong> })}{' '}
            {profile.sameUser && t('users.profile.approvalOwnAdvice', { count: posts.length })}
          </p>
          {visitorIsMember && <p>{t.rich('users.profile.approvalCheckHint', { count: posts.length, strong: (c) => <strong className="text-success">{c}</strong> })}</p>}
          {isStaff && profile.deviantArtUrl && (
            <div className="mb-2">
              <Button
                tag="a"
                color="guide-link"
                href={`https://www.deviantart.com/mlp-vectorclub/messages/?log_type=1&instigator_module_type=21&instigator_username=${encodeURIComponent(profile.user.name)}&bpp_status=3&display_order=desc`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <InlineIcon icon="arrow-right" first />
                {t('users.profile.openSubmissions')}
              </Button>
            </div>
          )}
          <ul className={postStyles.list} id="awaiting-deviations">
            {posts.map((post) => (
              <ProfilePostCard
                key={post.id}
                post={post}
                deviation
                actions={
                  <>
                    <Button tag={Link} href={postAddress(post)} color="blue" size="sm">
                      <InlineIcon icon="arrow-right" first />
                      {t('users.profile.view')}
                    </Button>
                    {visitorIsMember && (
                      <Button color="success" size="sm" disabled={check.isPending} onClick={() => check.mutate(post.id)}>
                        <InlineIcon icon="check" first />
                        {t('users.profile.check')}
                      </Button>
                    )}
                  </>
                }
              />
            ))}
          </ul>
          {check.error && (
            <Alert color="danger" fade={false} role="alert">
              {describeApiError(check.error)}
            </Alert>
          )}
        </>
      ) : (
        <p>{t('users.profile.approvalNone', { who })}</p>
      )}
    </section>
  );
};
