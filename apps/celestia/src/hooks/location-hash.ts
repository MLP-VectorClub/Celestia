import { Router } from 'next/router';
import { useEffect, useState } from 'react';

/** The part of the address after the `#`, kept current as the visitor follows links within the page (empty on the server) */
export const useLocationHash = (): string => {
  const [hash, setHash] = useState('');

  useEffect(() => {
    const read = () => setHash(decodeURIComponent(window.location.hash.slice(1)));
    read();
    window.addEventListener('hashchange', read);
    Router.events.on('hashChangeComplete', read);
    Router.events.on('routeChangeComplete', read);
    return () => {
      window.removeEventListener('hashchange', read);
      Router.events.off('hashChangeComplete', read);
      Router.events.off('routeChangeComplete', read);
    };
  }, []);

  return hash;
};
