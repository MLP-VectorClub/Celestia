import { GetServerSideProps } from 'next';

import { showFetcher } from 'src/fetchers';
import { PATHS } from 'src/paths';
import { handleDataFetchingError, notFound } from 'src/utils';

/** The old URL of any show entry by its ID (`/show/12`): sends the visitor to the page of that episode, movie, short or special */
export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { query, req } = ctx;
  if (typeof query.id !== 'string' || !/^\d+$/.test(query.id)) return notFound(ctx);

  try {
    const { show } = await showFetcher({ id: Number(query.id) }, req)();
    return { redirect: { destination: PATHS.EPISODE(show), permanent: false } };
  } catch (e) {
    handleDataFetchingError(ctx, e);
    return notFound(ctx);
  }
};

// Everything happens in getServerSideProps, the page itself is never rendered
export default function ShowRedirect() {
  return null;
}
