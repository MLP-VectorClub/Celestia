import { PostItem } from '@mlp-vectorclub/api-types';
import { permission } from 'src/utils/permission';

/**
 * Which actions a visitor is offered on a post. The API makes the final decision (and answers 403/409 where this guess is wrong),
 * `post.canEdit` and the roles only decide what is worth showing.
 */
export const getPostActions = (post: PostItem, user: { id: number | null; role: Parameters<typeof permission>[0] }) => {
  const signedIn = user.id !== null;
  const isMember = signedIn && permission(user.role, 'member');
  const isStaff = signedIn && permission(user.role, 'staff');
  const isReserver = signedIn && post.reservedBy?.id === user.id;
  const isPoster = signedIn && post.postedBy?.id === user.id;
  const finished = post.finishedAt !== null;
  const mine = isReserver || isStaff;
  // Like the old site: members see a reservation that has gone overdue as free (they may take it over), unless it is theirs or they are staff
  const overdueForMember = isMember && post.overdue;
  const reserverHidden = Boolean(post.reservedBy) && overdueForMember && !isReserver && !isStaff;

  return {
    reserve: isMember && post.kind === 'request' && (!post.reservedBy || reserverHidden) && !post.broken,
    /** The reserver is not shown to this visitor, the reservation can be taken over instead */
    reserverHidden,
    /** The reservation is overdue and belongs to somebody else, whom the reserved line then names */
    overdueReservedByOther: overdueForMember && Boolean(post.reservedBy) && !isReserver,
    /** The "can be contested" note is for everybody who may reserve (the old site only showed it to the reserver and staff, but it is the members who can act on it) */
    contestNote: overdueForMember,
    unreserve: isMember && Boolean(post.reservedBy) && !finished && !post.approved && mine,
    finish: isMember && Boolean(post.reservedBy) && !finished && mine,
    unfinish: isMember && finished && !post.approved && mine,
    approve: isMember && finished && !post.approved && !post.broken,
    unapprove: isStaff && post.approved,
    deleteRequest: post.kind === 'request' && !post.reservedBy && (isPoster || isStaff),
    edit: signedIn && post.canEdit,
    // Approved posts are locked; posters may only swap the image while a request is still unreserved
    changeImage: signedIn && !post.approved && (isStaff || (isPoster && (post.kind === 'reservation' || !post.reservedBy))),
    unbreak: isStaff && post.broken,
  };
};
