import { GetServerSideProps } from 'next';

import { postLocationFetcher, showFetcher } from 'src/fetchers';
import { PATHS } from 'src/paths';
import { handleDataFetchingError, notFound } from 'src/utils';
import { parseSharedPostId } from 'src/utils/post-share';

/** Short links to a post (`/s/1z`, the ID in base 36) send the visitor to the post inside its show's page */
export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { query, req } = ctx;
  const id = typeof query.id === 'string' ? parseSharedPostId(query.id) : null;
  if (id === null) return notFound(ctx);

  try {
    const { castle } = await postLocationFetcher({ id }, req)();
    if (!castle?.showId) return notFound(ctx);

    const { show } = await showFetcher({ id: castle.showId }, req)();
    return { redirect: { destination: `${PATHS.EPISODE(show)}#post-${castle.postId ?? id}`, permanent: false } };
  } catch (e) {
    handleDataFetchingError(ctx, e);
    return notFound(ctx);
  }
};

// Everything happens in getServerSideProps, the page itself is never rendered
export default function SharedPostRedirect() {
  return null;
}
