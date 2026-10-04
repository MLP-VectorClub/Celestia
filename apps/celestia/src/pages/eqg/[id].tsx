import { GetServerSideProps } from 'next';

/** The old Equestria Girls URLs: `/eqg/3` is the movie with that ID, `/eqg/friendship-games` the movie `equestria-girls-friendship-games` */
export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const id = typeof query.id === 'string' ? query.id : '';
  const destination = /^\d+$/.test(id) ? `/movie/${id}` : `/movie/equestria-girls-${encodeURIComponent(id)}`;
  return { redirect: { destination, permanent: false } };
};

// Everything happens in getServerSideProps, the page itself is never rendered
export default function EqgRedirect() {
  return null;
}
