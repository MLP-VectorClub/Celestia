import { useMemo, useRef, useState } from 'react';
import { ReactQueryDevtools } from 'react-query/devtools';
import { QueryClientProvider } from 'react-query';
import { DEV_ENV } from 'src/config';
import { wrapper } from 'src/store';
import TitleManager from 'src/components/TitleManager';
import { appLibrary } from '../fontawesome';
import '../app.scss';
import AuthModal from 'src/components/modals/AuthModal';
import ProgressIndicator from 'src/components/ProgressIndicator';
import Layout from 'src/components/Layout';
import { LayoutContextProvider } from 'src/hooks';
import { NextIntlClientProvider } from 'next-intl';
import { AppComponent } from 'next/dist/shared/lib/router/router';
import { useRouter } from 'next/router';
import { queryClient } from 'src/store/queryClient';
import { Provider } from 'react-redux';

const Celestia: AppComponent = ({ Component, ...rest }) => {
   
  const { store, props } = wrapper.useWrappedStore(rest);
  const { locale } = useRouter();
  const [disabled, setLayoutDisabled] = useState(false);
  useRef(appLibrary);

  const layoutContext = useMemo(() => ({ disabled, setLayoutDisabled }), [disabled, setLayoutDisabled]);

  return (
     
    <Provider store={store}>
      { }
      <NextIntlClientProvider locale={locale || 'en'} messages={props.pageProps.messages}>
        <QueryClientProvider client={queryClient}>
          <TitleManager />
          <ProgressIndicator />
          <LayoutContextProvider value={layoutContext}>
            <Layout>
              { }
              <Component {...props.pageProps} />
            </Layout>
          </LayoutContextProvider>
          <AuthModal />
          {DEV_ENV && <ReactQueryDevtools position="top-right" initialIsOpen={false} />}
        </QueryClientProvider>
      </NextIntlClientProvider>
    </Provider>
  );
};

export default Celestia;
