import { GetServerSideProps } from 'next';

import { legacyPostIdFetcher } from 'src/fetchers';
import { handleDataFetchingError, notFound } from 'src/utils';

const KINDS = { req: 'request', res: 'reservation' } as const;

/**
 * Links from before the 2020 migration (`/s/req/123` for a request, `/s/res/45` for a reservation) carry the post's old number: looks up the post it
 * became and carries on with the short link of that
 */
export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { query, req } = ctx;
  const { thing, id } = query;
  if (typeof thing !== 'string' || !(thing in KINDS) || typeof id !== 'string' || !/^\d{1,10}$/.test(id)) return notFound(ctx);

  try {
    const post = await legacyPostIdFetcher({ kind: KINDS[thing as keyof typeof KINDS], oldId: Number(id) }, req)();
    return { redirect: { destination: `/s/${post.id.toString(36)}`, permanent: false } };
  } catch (e) {
    handleDataFetchingError(ctx, e);
    return notFound(ctx);
  }
};

// Everything happens in getServerSideProps, the page itself is never rendered
export default function LegacySharedPostRedirect() {
  return null;
}
