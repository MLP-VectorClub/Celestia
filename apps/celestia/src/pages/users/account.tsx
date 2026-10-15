import { NextPage } from 'next';

import { OwnAccountGate, ownAccountPath, ownAccountTitleFactory } from 'src/components/users/OwnAccountGate';
import { wrapper } from 'src/store';
import { SSRMessages } from 'src/types';
import { titleSetter } from 'src/utils/core';
import { typedServerSideTranslations } from 'src/utils/i18n';

const OwnAccountPage: NextPage = () => <OwnAccountGate />;

export const getServerSideProps = wrapper.getServerSideProps<SSRMessages>((store) => async ({ locale }) => {
  // The server already knows a signed in visitor, no reason to render a page for them
  const asking = store.getState().auth.initialUser;
  if (asking && asking.id !== null) return { redirect: { destination: ownAccountPath(asking.id), permanent: false } };

  titleSetter(store, ownAccountTitleFactory());
  return { props: { ...(await typedServerSideTranslations(locale, ['users'])) } };
});

export default OwnAccountPage;
