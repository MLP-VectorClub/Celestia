import { ownProfileRedirect } from 'src/utils/own-profile-redirect';

export const getServerSideProps = ownProfileRedirect;

// Everything happens in getServerSideProps, the page itself is never rendered
export default function OwnProfileRedirect() {
  return null;
}
