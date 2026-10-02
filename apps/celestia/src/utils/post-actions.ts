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

  return {
    reserve: isMember && post.kind === 'request' && !post.reservedBy && !post.broken,
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
