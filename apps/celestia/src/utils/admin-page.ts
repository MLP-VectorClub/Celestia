import { GetServerSidePropsContext } from 'next';

import { AdminSection, adminTitle } from 'src/components/admin/AdminPage';
import { wrapper } from 'src/store';
import { SSRMessages } from 'src/types';
import { titleSetter } from 'src/utils/core';
import { typedServerSideTranslations } from 'src/utils/i18n';
import { forbidden } from 'src/utils/initial-prop-helpers';
import { permission } from 'src/utils/permission';

/**
 * The staff pages load their data in the browser by default, the server only provides the title and messages. A page can hand over `load` to
 * fetch its first data on the server too (with the visitor's session, `ResourceService(ctx.req)`) so it renders filled in from the start
 */
export const createAdminGetServerSideProps = <Extra extends Record<string, unknown> = Record<string, never>>(
  section: AdminSection,
  role: 'staff' | 'developer' = 'staff',
  load?: (ctx: GetServerSidePropsContext) => Promise<Extra>
) =>
  wrapper.getServerSideProps<SSRMessages & Extra>((store) => async (ctx) => {
    const { locale } = ctx;
    // Staff (or developers) only: the server already knows who is asking
    if (!permission(store.getState().auth.initialUser, role)) return forbidden(ctx);

    titleSetter(store, adminTitle(section));
    const extra = load ? await load(ctx) : ({} as Extra);
    return { props: { ...(await typedServerSideTranslations(locale, ['admin', 'show'])), ...extra } };
  });
