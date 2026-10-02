import { GetServerSideProps } from 'next';

import { PATHS } from 'src/paths';
import { parseListPage } from 'src/utils/post-share';

/** Old paginated list URL (`/movies/3`), now a page of the combined show list */
export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const page = parseListPage(query.page);
  return { redirect: { destination: page > 1 ? `${PATHS.SHOW}?page=${page}` : PATHS.SHOW, permanent: true } };
};

export default function MoviesRedirect() {
  return null;
}
