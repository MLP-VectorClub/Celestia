import { GetServerSideProps } from 'next';

import { requestUserFetcher } from 'src/fetchers/auth';
import { PATHS } from 'src/paths';
import { notFound } from 'src/utils';

/** `/settings` and `/u` of the old site: the signed in visitor's own profile, nothing for guests (the old site had no page there either) */
export const ownProfileRedirect: GetServerSideProps = async (ctx) => {
  const user = await requestUserFetcher(ctx.req);
  if (!user || user.id === null) return notFound(ctx);
  return { redirect: { destination: PATHS.USER_LONG(user), permanent: false } };
};
