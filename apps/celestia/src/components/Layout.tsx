import classNames from 'classnames';
import Head from 'next/head';
import { FC, PropsWithChildren, useEffect } from 'react';

import Footer from 'src/components/Footer';
import Header from 'src/components/Header';
import { Main } from 'src/components/Main';
import Sidebar from 'src/components/Sidebar';
import Breadcrumbs from 'src/components/shared/Breadcrumbs';
import Notices from 'src/components/shared/Notices';
import { useLayout } from 'src/hooks';

const layoutDisabledClass = 'layout-disabled';

const Layout: FC<PropsWithChildren> = ({ children }) => {
  const { disabled } = useLayout();

  useEffect(() => {
    document.body.className = classNames({ [layoutDisabledClass]: disabled });
  }, [disabled]);

  if (disabled) {
    return <>{children}</>;
  }

  return (
    <div id="layout">
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
      </Head>
      <Header />
      <Sidebar />
      <aside id="above-content">
        <Breadcrumbs />
        <Notices />
      </aside>
      <Main>{children}</Main>
      <Footer />
    </div>
  );
};

export default Layout;
