import { GetServerSideProps, NextPage } from 'next';

import { API_HOST } from 'src/config';

/**
 * Signs in as a seeded test user, for browser tests that start from a signed in session: it asks the API's test-only route for a cookie session, hands
 * the cookies to the browser and goes to `/` (or `?to=/some/path`). It does nothing unless the server runs with `E2E_TEST_LOGIN=1`, and the API only has
 * that route in its testing environment, so there is no way to sign in with it anywhere else.
 */
const TestLogin: NextPage = () => null;

export const getServerSideProps: GetServerSideProps = async ({ query, res }) => {
  const { id, to } = query;
  if (process.env.E2E_TEST_LOGIN !== '1' || typeof id !== 'string' || !/^\d+$/.test(id)) return { notFound: true };

  const response = await fetch(`${API_HOST}/test/session-login/${id}`, { redirect: 'manual' });
  if (response.status >= 400) return { notFound: true };

  const cookies = response.headers.getSetCookie();
  if (cookies.length > 0) res.setHeader('Set-Cookie', cookies);

  // Only paths on this site
  const destination = typeof to === 'string' && /^\/(?!\/)/.test(to) ? to : '/';
  return { redirect: { destination, statusCode: 302 } };
};

export default TestLogin;
