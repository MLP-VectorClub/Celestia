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
  broken: false,
  overdue: false,
  canEdit: false,
  ...overrides,
});

const guest = { id: null, role: null } as const;
const member = { id: 20, role: 'member' } as const;
const staff = { id: 30, role: 'staff' } as const;

describe('getPostActions', () => {
  it('offers nothing to guests', () => {
    expect(Object.values(getPostActions(post(), guest)).some(Boolean)).toBe(false);
  });

  it('lets members reserve an open request', () => {
    expect(getPostActions(post(), member).reserve).toBe(true);
    expect(getPostActions(post({ reservedBy: { id: 99, name: 'Other' } }), member).reserve).toBe(false);
  });

  it('lets only the reserver (or staff) finish and cancel a reservation', () => {
    const reserved = post({ reservedBy: { id: 20, name: 'Me' } });
    expect(getPostActions(reserved, member)).toMatchObject({ finish: true, unreserve: true, reserve: false });
    expect(getPostActions(reserved, { id: 21, role: 'member' })).toMatchObject({ finish: false, unreserve: false });
    expect(getPostActions(reserved, staff)).toMatchObject({ finish: true, unreserve: true });
  });

  it('offers approval for finished posts and its removal to staff only', () => {
    const finished = post({ reservedBy: { id: 20, name: 'Me' }, finishedAt: '2026-01-02T00:00:00+00:00', deviationId: 'dabc' });
    expect(getPostActions(finished, member)).toMatchObject({ approve: true, unfinish: true, finish: false, unapprove: false });
    const approved = { ...finished, approved: true };
    expect(getPostActions(approved, member)).toMatchObject({ approve: false, unfinish: false, unapprove: false });
    expect(getPostActions(approved, staff).unapprove).toBe(true);
  });

  it('lets the poster delete an unreserved request', () => {
    expect(getPostActions(post(), { id: 10, role: 'user' }).deleteRequest).toBe(true);
    expect(getPostActions(post({ reservedBy: { id: 20, name: 'Me' } }), { id: 10, role: 'user' }).deleteRequest).toBe(false);
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
    expect(getPostActions(post({ reservedBy: { id: 20, name: 'Me' } }), posterOnly).changeImage).toBe(false);
  });

  it('lets the poster change the image of their reservation', () => {
    expect(getPostActions(post({ kind: 'reservation', reservedBy: { id: 10, name: 'Poster' } }), posterOnly).changeImage).toBe(true);
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
});
