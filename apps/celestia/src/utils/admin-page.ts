import { wrapper } from 'src/store';
import { SSRMessages } from 'src/types';
import { titleSetter } from 'src/utils/core';
import { typedServerSideTranslations } from 'src/utils/i18n';

/** The staff pages load their data in the browser (it needs the visitor's session), the server only provides the title and messages */
export const createAdminGetServerSideProps = (title: string) =>
  wrapper.getServerSideProps<SSRMessages>((store) => async ({ locale }) => {
    titleSetter(store, {
      title,
      breadcrumbs: [
        { label: 'Administration', linkProps: { href: '/admin' } },
        { label: title, active: true },
      ],
    });
    return { props: { ...(await typedServerSideTranslations(locale, ['common'])) } };
  });
