import { GetServerSideProps } from 'next';

import { userFetcher } from 'src/fetchers/profile';
import { PATHS } from 'src/paths';
import { handleDataFetchingError, notFound } from 'src/utils';

/** The old profile URLs by name (`/@Name`, rewritten to this page, and `/u/Name`): sends the visitor to the profile of that user */
export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { query } = ctx;
  if (typeof query.name !== 'string' || query.name === '') return notFound(ctx);

  try {
    const user = await userFetcher({ username: query.name })();
    return { redirect: { destination: PATHS.USER_LONG(user), permanent: false } };
  } catch (e) {
    handleDataFetchingError(ctx, e);
    return notFound(ctx);
  }
};

// Everything happens in getServerSideProps, the page itself is never rendered
export default function ProfileByNameRedirect() {
  return null;
}
