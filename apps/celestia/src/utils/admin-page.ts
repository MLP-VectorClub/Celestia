import { GetServerSidePropsContext } from 'next';

import { AdminSection, adminTitle } from 'src/components/admin/AdminPage';
import { ResourceService } from 'src/services/resource';
import { wrapper } from 'src/store';
import { SSRMessages } from 'src/types';
import { titleSetter } from 'src/utils/core';
import { typedServerSideTranslations } from 'src/utils/i18n';
import { forbidden } from 'src/utils/initial-prop-helpers';
import { permission } from 'src/utils/permission';

/** A GET with the visitor's session, `null` when it fails: the page then asks again from the browser instead of failing to render */
export const fetchForAdminPage = async <T>(ctx: GetServerSidePropsContext, url: string): Promise<T | null> => {
  try {
    return (await new ResourceService(ctx.req).get<T>(url)).data;
  } catch {
    return null;
  }
};

/**
 * The staff pages load their data in the browser by default, the server only provides the title and messages. A page can hand over `load` to
 * fetch its first data on the server too (with the visitor's session, `ResourceService(ctx.req)`) so it renders filled in from the start
 */
export const createAdminGetServerSideProps = <Extra extends Record<string, unknown> = Record<string, never>>(
  section: AdminSection,
  role: 'staff' | 'developer' = 'staff',
  load?: (ctx: GetServerSidePropsContext, user: Parameters<typeof permission>[0]) => Promise<Extra>
) =>
  wrapper.getServerSideProps<SSRMessages & Extra>((store) => async (ctx) => {
    const { locale } = ctx;
    // Staff (or developers) only: the server already knows who is asking
    if (!permission(store.getState().auth.initialUser, role)) return forbidden(ctx);

    titleSetter(store, adminTitle(section));
    const extra = load ? await load(ctx, store.getState().auth.initialUser) : ({} as Extra);
    return { props: { ...(await typedServerSideTranslations(locale, ['admin', 'show'])), ...extra } };
  });
