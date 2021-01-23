import React, { useState } from 'react';
import { DefaultSeo } from 'next-seo';
import { AppType } from 'next/dist/next-server/lib/utils';
import { ReactQueryDevtools } from 'react-query-devtools';
import { ReactQueryConfigProvider } from 'react-query';
import { APP_NAME, APP_URL, DEV_ENV, REACT_QUERY_CONFIG } from 'src/config';
import { wrapper } from 'src/store';
import TitleManager from 'src/components/TitleManager';
import '../fontawesome';
import '../app.scss';
import AuthModal from 'src/components/modals/AuthModal';
import ProgressIndicator from 'src/components/ProgressIndicator';
import Layout from 'src/components/Layout';
import { LayoutContext } from 'src/hooks';

const Celestia: AppType = props => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { Component, pageProps } = props;
  const [disabled, setLayoutDisabled] = useState(false);

  return (
    <ReactQueryConfigProvider config={REACT_QUERY_CONFIG}>
      <TitleManager />
      <DefaultSeo
        openGraph={{
          type: 'website',
          url: APP_URL,
          site_name: APP_NAME,
        }}
      />
      <ProgressIndicator />
      <LayoutContext.Provider value={{ disabled, setLayoutDisabled }}>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </LayoutContext.Provider>
      <AuthModal />
      {DEV_ENV && (
        <ReactQueryDevtools position="top-right" initialIsOpen={false} />
      )}
    </ReactQueryConfigProvider>
  );
};

export default wrapper.withRedux(Celestia);
