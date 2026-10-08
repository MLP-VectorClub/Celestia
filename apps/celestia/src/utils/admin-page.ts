import { AdminSection, adminTitle } from 'src/components/admin/AdminPage';
import { wrapper } from 'src/store';
import { SSRMessages } from 'src/types';
import { titleSetter } from 'src/utils/core';
import { typedServerSideTranslations } from 'src/utils/i18n';
import { forbidden } from 'src/utils/initial-prop-helpers';
import { permission } from 'src/utils/permission';

/** The staff pages load their data in the browser (it needs the visitor's session), the server only provides the title and messages */
export const createAdminGetServerSideProps = (section: AdminSection, role: 'staff' | 'developer' = 'staff') =>
  wrapper.getServerSideProps<SSRMessages>((store) => async (ctx) => {
    const { locale } = ctx;
    // Staff (or developers) only: the server already knows who is asking
    if (!permission(store.getState().auth.initialUser, role)) return forbidden(ctx);

    titleSetter(store, adminTitle(section));
    return { props: { ...(await typedServerSideTranslations(locale, ['admin', 'show'])) } };
  });
