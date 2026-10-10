import { describe, expect, it } from 'vitest';

import { PostItem } from '@mlp-vectorclub/api-types';
import { getPostActions } from 'src/utils/post-actions';

const post = (overrides: Partial<PostItem> = {}): PostItem => ({
  id: 1,
  kind: 'request',
  type: 'chr',
  showId: 1,
  label: 'A pony',
  previewUrl: 'http://x/p.png',
  fullsizeUrl: 'http://x/f.png',
  postedAt: '2026-01-01T00:00:00+00:00',
  postedBy: { id: 10, name: 'Poster' },
  reservedBy: null,
  reservedAt: null,
  finishedAt: null,
  deviationId: null,
  approved: false,
  approvedAt: null,
  approvedBy: null,
  broken: false,
  overdue: false,
  canEdit: false,
  ...overrides,
});

const reserver = (id: number, name: string) => ({ id, name, avatarUrl: null, avatarProvider: 'deviantart' as const, vectorApp: null });

const guest = { id: null, role: null } as const;
const member = { id: 20, role: 'member' } as const;
const staff = { id: 30, role: 'staff' } as const;

describe('getPostActions', () => {
  it('offers nothing to guests', () => {
    expect(Object.values(getPostActions(post(), guest)).some(Boolean)).toBe(false);
  });

  it('lets members reserve an open request', () => {
    expect(getPostActions(post(), member).reserve).toBe(true);
    expect(getPostActions(post({ reservedBy: reserver(99, 'Other') }), member).reserve).toBe(false);
  });

  it('lets only the reserver (or staff) finish and cancel a reservation', () => {
    const reserved = post({ reservedBy: reserver(20, 'Me') });
    expect(getPostActions(reserved, member)).toMatchObject({ finish: true, unreserve: true, reserve: false });
    expect(getPostActions(reserved, { id: 21, role: 'member' })).toMatchObject({ finish: false, unreserve: false });
    expect(getPostActions(reserved, staff)).toMatchObject({ finish: true, unreserve: true });
  });

  it('offers approval for finished posts and its removal to staff only', () => {
    const finished = post({ reservedBy: reserver(20, 'Me'), finishedAt: '2026-01-02T00:00:00+00:00', deviationId: 'dabc' });
    expect(getPostActions(finished, member)).toMatchObject({ approve: true, unfinish: true, finish: false, unapprove: false });
    const approved = { ...finished, approved: true };
    expect(getPostActions(approved, member)).toMatchObject({ approve: false, unfinish: false, unapprove: false });
    expect(getPostActions(approved, staff).unapprove).toBe(true);
  });

  it('lets the poster delete an unreserved request', () => {
    expect(getPostActions(post(), { id: 10, role: 'user' }).deleteRequest).toBe(true);
    expect(getPostActions(post({ reservedBy: reserver(20, 'Me') }), { id: 10, role: 'user' }).deleteRequest).toBe(false);
  });
});

describe('getPostActions editing', () => {
  const posterOnly = { id: 10, role: 'user' } as const;

  it('offers editing only when the API says the post can be edited', () => {
    expect(getPostActions(post({ canEdit: true }), posterOnly).edit).toBe(true);
    expect(getPostActions(post({ canEdit: false }), posterOnly).edit).toBe(false);
    expect(getPostActions(post({ canEdit: true }), guest).edit).toBe(false);
  });

  it('lets the poster change the image of a request until somebody reserves it', () => {
    expect(getPostActions(post(), posterOnly).changeImage).toBe(true);
    expect(getPostActions(post({ reservedBy: reserver(20, 'Me') }), posterOnly).changeImage).toBe(false);
  });

  it('lets the poster change the image of their reservation', () => {
    expect(getPostActions(post({ kind: 'reservation', reservedBy: reserver(10, 'Poster') }), posterOnly).changeImage).toBe(true);
  });

  it('locks the image of approved posts, also for staff, and hides it from strangers', () => {
    expect(getPostActions(post({ approved: true }), staff).changeImage).toBe(false);
    expect(getPostActions(post(), member).changeImage).toBe(false);
    expect(getPostActions(post(), staff).changeImage).toBe(true);
  });

  it('offers unbreaking to staff on broken posts only', () => {
    expect(getPostActions(post({ broken: true }), staff).unbreak).toBe(true);
    expect(getPostActions(post({ broken: true }), member).unbreak).toBe(false);
    expect(getPostActions(post({ broken: false }), staff).unbreak).toBe(false);
  });

  describe('overdue reservations', () => {
    const overdue = (user: Parameters<typeof getPostActions>[1], reservedById = 99) =>
      getPostActions(post({ reservedBy: reserver(reservedById, 'Slowpoke'), overdue: true }), user);

    it('lets another member take a reservation over and hides the reserver from them', () => {
      const actions = overdue(member);
      expect(actions.reserve).toBe(true);
      expect(actions.reserverHidden).toBe(true);
      expect(actions.contestNote).toBe(true);
    });

    it('keeps the reserver visible to staff, names them in the reserved line and shows them the contest note, without a reserve button', () => {
      const actions = overdue(staff);
      expect(actions.reserve).toBe(false);
      expect(actions.reserverHidden).toBe(false);
      expect(actions.overdueReservedByOther).toBe(true);
      expect(actions.contestNote).toBe(true);
    });

    it('does not offer the reserver their own reservation, but tells them it can be contested', () => {
      const actions = overdue({ id: 99, role: 'member' });
      expect(actions.reserve).toBe(false);
      expect(actions.reserverHidden).toBe(false);
      expect(actions.overdueReservedByOther).toBe(false);
      expect(actions.contestNote).toBe(true);
    });

    it('shows guests the ordinary reservation', () => {
      const actions = overdue(guest);
      expect(actions.reserve).toBe(false);
      expect(actions.reserverHidden).toBe(false);
      expect(actions.contestNote).toBe(false);
    });

    it('treats a reservation that is not overdue as taken', () => {
      const actions = getPostActions(post({ reservedBy: reserver(99, 'Busy'), overdue: false }), member);
      expect(actions.reserve).toBe(false);
      expect(actions.reserverHidden).toBe(false);
    });

    it('does not let anybody take over a broken post', () => {
      expect(getPostActions(post({ reservedBy: reserver(99, 'Slowpoke'), overdue: true, broken: true }), member).reserve).toBe(false);
    });
  });
});
