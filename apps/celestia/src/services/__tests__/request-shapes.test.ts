import Axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AccountService } from 'src/services/account';
import { AdminService } from 'src/services/admin';
import { AppearanceEditService } from 'src/services/appearance-edit';
import { ColorGroupService } from 'src/services/color-groups';
import { PostService } from 'src/services/posts';
import { TagService } from 'src/services/tags';
import { UserAdminService } from 'src/services/user-admin';

vi.mock('axios', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }));

const axios = vi.mocked(Axios);

beforeEach(() => vi.clearAllMocks());

type Method = 'get' | 'post' | 'put' | 'delete';
/** What a call has to send: the method, the address and the rest of the arguments (the body or the request options) */
type Case = [name: string, call: () => unknown, method: Method, url: string, ...rest: unknown[]];

const run = (cases: Case[]) =>
  it.each(cases)('%s', (_name, call, method, url, ...rest) => {
    call();
    for (const other of ['get', 'post', 'put', 'delete'] as Method[]) {
      if (other !== method) expect(axios[other]).not.toHaveBeenCalled();
    }
    expect(axios[method]).toHaveBeenCalledTimes(1);
    expect(axios[method].mock.calls[0]).toEqual([url, ...rest]);
  });

describe('AppearanceEditService', () => {
  run([
    [
      'creates',
      () => AppearanceEditService.create({ guide: 'pony', label: 'A' } as never),
      'post',
      '/appearances',
      { guide: 'pony', label: 'A' },
    ],
    ['reads metadata', () => AppearanceEditService.getMetadata(4), 'get', '/appearances/4/metadata'],
    ['updates with the guide', () => AppearanceEditService.update(4, { guide: 'eqg' } as never), 'put', '/appearances/4', { guide: 'eqg' }],
    ['removes', () => AppearanceEditService.remove(4), 'delete', '/appearances/4'],
    [
      'clears parts, sending what to clear as the body',
      () => AppearanceEditService.clear(4, { notes: true } as never),
      'delete',
      '/appearances/4/contents',
      { data: { notes: true } },
    ],
    ['pins', () => AppearanceEditService.pin(4), 'post', '/appearances/4/pin'],
    ['unpins', () => AppearanceEditService.unpin(4), 'delete', '/appearances/4/pin'],
    ['reads tags', () => AppearanceEditService.getTags(4), 'get', '/appearances/4/tags'],
    [
      'sets tags with the original ones',
      () => AppearanceEditService.setTags(4, 'a,b', 'a'),
      'put',
      '/appearances/4/tags',
      { tags: 'a,b', origTags: 'a' },
    ],
    ['removes the sprite', () => AppearanceEditService.removeSprite(4), 'delete', '/appearances/4/sprite'],
    ['reads cutie marks', () => AppearanceEditService.getCutieMarks(4), 'get', '/appearances/4/cutie-marks'],
    ['sets cutie marks', () => AppearanceEditService.setCutieMarks(4, []), 'put', '/appearances/4/cutie-marks', { cutieMarks: [] }],
    [
      'orders the guide by relevance',
      () => AppearanceEditService.reorderGuide('pony', [3, 1, 2]),
      'put',
      '/appearances/order',
      { guide: 'pony', list: [3, 1, 2], ordering: 'relevance' },
    ],
  ]);

  it('uploads a sprite as a form with the file under "sprite"', () => {
    const file = new File(['x'], 'sprite.png', { type: 'image/png' });
    AppearanceEditService.uploadSprite(4, file);
    const [url, body] = axios.post.mock.calls[0] as [string, FormData];
    expect(url).toBe('/appearances/4/sprite');
    expect(body.get('sprite')).toBe(file);
  });

  it('sends an SVG for sanitizing as a form with the file under "file"', () => {
    const file = new File(['<svg/>'], 'cm.svg', { type: 'image/svg+xml' });
    AppearanceEditService.sanitizeSvg(4, file);
    const [url, body] = axios.post.mock.calls[0] as [string, FormData];
    expect(url).toBe('/appearances/4/sanitize-svg');
    expect(body.get('file')).toBe(file);
  });
});

describe('PostService', () => {
  run([
    ['creates', () => PostService.create({ kind: 'request' } as never), 'post', '/posts', { kind: 'request' }],
    ['checks an image', () => PostService.checkImage('http://x/y.png'), 'post', '/posts/check-image', { imageUrl: 'http://x/y.png' }],
    ['reserves', () => PostService.reserve(2, { postAs: 'x' } as never), 'post', '/posts/2/reservation', { postAs: 'x' }],
    ['reloads', () => PostService.reload(2), 'get', '/posts/2/reload'],
    ['unreserves', () => PostService.unreserve(2), 'delete', '/posts/2/reservation'],
    [
      'finishes',
      () => PostService.finish(2, { deviation: 'a', allowOverwriteReserver: true } as never),
      'put',
      '/posts/2/finish',
      { deviation: 'a', allowOverwriteReserver: true },
    ],
    ['unfinishes', () => PostService.unfinish(2), 'delete', '/posts/2/finish', { params: undefined }],
    ['unfinishes and unbinds the reserver', () => PostService.unfinish(2, true), 'delete', '/posts/2/finish', { params: { unbind: 1 } }],
    ['approves', () => PostService.approve(2), 'post', '/posts/2/approval'],
    ['removes the approval', () => PostService.unapprove(2), 'delete', '/posts/2/approval'],
    ['deletes a request', () => PostService.deleteRequest(2), 'delete', '/posts/requests/2'],
    ['updates', () => PostService.update(2, { label: 'L', type: 'bg' }), 'put', '/posts/2', { label: 'L', type: 'bg' }],
    ['changes the image', () => PostService.changeImage(2, 'http://x/z.png'), 'put', '/posts/2/image', { imageUrl: 'http://x/z.png' }],
    ['unbreaks', () => PostService.unbreak(2), 'post', '/posts/2/unbreak'],
    [
      'adds a finished reservation',
      () => PostService.addReservation(9, 'fav.me/dabc'),
      'post',
      '/posts/reservations',
      { showId: 9, deviation: 'fav.me/dabc' },
    ],
    ['votes', () => PostService.vote(9, 5), 'post', '/show/9/vote', { vote: 5 }],
  ]);
});

describe('AccountService', () => {
  run([
    [
      'sends booleans as 1 and 0',
      () => AccountService.setPreference(3, 'cg_nutshell' as never, true as never),
      'put',
      '/users/3/preferences/cg_nutshell',
      { value: 1 },
    ],
    [
      'sends other values as they are',
      () => AccountService.setPreference(3, 'cg_itemsperpage' as never, 20 as never),
      'put',
      '/users/3/preferences/cg_itemsperpage',
      { value: 20 },
    ],
    ['reads preferences', () => AccountService.getPreferences(3), 'get', '/users/3/preferences'],
    ['reads notifications', () => AccountService.getNotifications(), 'get', '/notifications'],
    ['asks for a websocket token', () => AccountService.getSocketToken(), 'post', '/users/me/socket-token'],
    ['marks a notification read', () => AccountService.markNotificationRead(8), 'post', '/notifications/8/read'],
    ['syncs Discord', () => AccountService.syncDiscord(3), 'post', '/users/3/discord/sync'],
    ['unlinks Discord', () => AccountService.unlinkDiscord(3), 'delete', '/users/3/discord'],
    ['changes the password', () => AccountService.changePassword({ newPassword: 'n' }), 'post', '/users/me/password', { newPassword: 'n' }],
    [
      'asks for an e-mail change',
      () => AccountService.requestEmailChange(3, { newEmail: 'a@b.c' }),
      'post',
      '/users/3/email-changes',
      { newEmail: 'a@b.c' },
    ],
    [
      'resends the e-mail change message as 1',
      () => AccountService.requestEmailChange(3, { resend: true }),
      'post',
      '/users/3/email-changes',
      { resend: 1 },
    ],
    ['verifies an e-mail', () => AccountService.verifyEmail('h', 'block'), 'post', '/users/email/verify', { hash: 'h', action: 'block' }],
    ['lists sessions', () => AccountService.getSessions(), 'get', '/users/sessions'],
    ['ends a session', () => AccountService.deleteSession('s1'), 'delete', '/users/sessions/s1'],
  ]);

  it('signs out everywhere with a form body', () => {
    AccountService.signOutEverywhere();
    const [url, body] = axios.post.mock.calls[0] as [string, URLSearchParams];
    expect(url).toBe('/users/signout');
    expect(body.toString()).toBe('everywhere=1');
  });
});

describe('ColorGroupService', () => {
  run([
    ['reads one', () => ColorGroupService.get(6), 'get', '/color-groups/6'],
    [
      'creates for an appearance',
      () => ColorGroupService.create(4, { label: 'Coat' } as never),
      'post',
      '/color-groups',
      { appearanceId: 4, label: 'Coat' },
    ],
    ['updates', () => ColorGroupService.update(6, { label: 'Mane' } as never), 'put', '/color-groups/6', { label: 'Mane' }],
    ['removes', () => ColorGroupService.remove(6), 'delete', '/color-groups/6'],
    ['reads the order', () => ColorGroupService.getOrder(4), 'get', '/appearances/4/color-groups/order'],
    ['sets the order', () => ColorGroupService.setOrder(4, [2, 1]), 'put', '/appearances/4/color-groups/order', { cgs: [2, 1] }],
    ['applies the template', () => ColorGroupService.applyTemplate(4), 'post', '/appearances/4/template'],
  ]);
});

describe('TagService', () => {
  run([
    ['creates', () => TagService.create({ name: 'n' } as never), 'post', '/tags', { name: 'n' }],
    ['updates', () => TagService.update(5, { name: 'm' } as never), 'put', '/tags/5', { name: 'm' }],
    ['removes without confirmation', () => TagService.remove(5, false), 'delete', '/tags/5', { params: undefined }],
    ['removes a tag in use after the confirmation', () => TagService.remove(5, true), 'delete', '/tags/5', { params: { sanityCheck: 1 } }],
    ['makes a synonym', () => TagService.makeSynonym(5, 6), 'put', '/tags/5/synonym', { targetId: 6 }],
    ['removes a synonym', () => TagService.removeSynonym(5, false), 'delete', '/tags/5/synonym', { params: undefined }],
    [
      'removes a synonym but keeps the tagged appearances',
      () => TagService.removeSynonym(5, true),
      'delete',
      '/tags/5/synonym',
      { params: { keepTagged: 1 } },
    ],
    ['autocompletes', () => TagService.autocomplete('tw'), 'get', '/tags/autocomplete', { params: { s: 'tw' } }],
    [
      'autocompletes without the tag itself',
      () => TagService.autocomplete('tw', 5),
      'get',
      '/tags/autocomplete',
      { params: { s: 'tw', not: 5 } },
    ],
    ['recounts uses', () => TagService.recountUses([1, 2]), 'post', '/tags/recount-uses', { tagIds: [1, 2] }],
  ]);
});

describe('UserAdminService', () => {
  run([
    ['sets the role', () => UserAdminService.setRole(3, 'staff' as never), 'put', '/users/3/role', { value: 'staff' }],
    ['checks slots', () => UserAdminService.checkSlots(3), 'get', '/users/3/personal-guide/slots'],
    ['reads points', () => UserAdminService.getPoints(3), 'get', '/users/3/personal-guide/points'],
    ['grants points', () => UserAdminService.grantPoints(3, { amount: 2 }), 'post', '/users/3/personal-guide/points', { amount: 2 }],
    [
      'recalculates the history',
      () => UserAdminService.recalculateHistory(3),
      'post',
      '/users/3/personal-guide/point-history/recalculation',
    ],
    ['purges the contributions cache', () => UserAdminService.purgeContributionsCache(3), 'delete', '/users/3/contributions/cache'],
  ]);
});

describe('AdminService', () => {
  run([
    ['lists logs', () => AdminService.logs({ page: 2 } as never), 'get', '/admin/logs', { params: { page: 2 } }],
    [
      'lists personal guide appearances',
      () => AdminService.pcgAppearances({ page: 3 }),
      'get',
      '/admin/pcg-appearances',
      { params: { page: 3 } },
    ],
    ['reads a log entry', () => AdminService.logDetails(7), 'get', '/admin/logs/7'],
    ['lists notices', () => AdminService.notices({ page: 1 } as never), 'get', '/notices', { params: { page: 1 } }],
    ['creates a notice', () => AdminService.createNotice({ html: 'x' } as never), 'post', '/notices', { html: 'x' }],
    ['updates a notice', () => AdminService.updateNotice(7, { html: 'y' } as never), 'put', '/notices/7', { html: 'y' }],
    ['deletes a notice', () => AdminService.deleteNotice(7), 'delete', '/notices/7'],
    ['lists useful links', () => AdminService.usefulLinks(), 'get', '/useful-links'],
    [
      'creates a link',
      () => AdminService.createUsefulLink({ label: 'l', url: '/u', minRole: 'user' }),
      'post',
      '/useful-links',
      { label: 'l', url: '/u', minRole: 'user' },
    ],
    [
      'updates a link',
      () => AdminService.updateUsefulLink(7, { label: 'l', url: '/u', minRole: 'user' }),
      'put',
      '/useful-links/7',
      { label: 'l', url: '/u', minRole: 'user' },
    ],
    ['deletes a link', () => AdminService.deleteUsefulLink(7), 'delete', '/useful-links/7'],
    [
      'orders links as a comma separated list',
      () => AdminService.orderUsefulLinks([3, 1, 2]),
      'put',
      '/useful-links/order',
      { list: '3,1,2' },
    ],
    ['reads a setting', () => AdminService.getSetting('reservation_rules'), 'get', '/settings/reservation_rules'],
    ['writes a setting', () => AdminService.setSetting('dev_role_label', 'Dev'), 'put', '/settings/dev_role_label', { value: 'Dev' }],
    ['reindexes the guide', () => AdminService.reindexColorGuide(), 'post', '/color-guide/reindex'],
    ['exports the guide as a file', () => AdminService.exportColorGuide(), 'get', '/color-guide/export', { responseType: 'blob' }],
  ]);
});
