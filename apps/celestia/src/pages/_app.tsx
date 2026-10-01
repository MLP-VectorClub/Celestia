import '../app.scss';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { NextIntlClientProvider } from 'next-intl';
import { AppComponent } from 'next/dist/shared/lib/router/router';
import { useRouter } from 'next/router';
import { useMemo, useRef, useState } from 'react';
import { Provider } from 'react-redux';

import Layout from 'src/components/Layout';
import ProgressIndicator from 'src/components/ProgressIndicator';
import TitleManager from 'src/components/TitleManager';
import AuthModal from 'src/components/modals/AuthModal';
import DeployBanner from 'src/components/shared/DeployBanner';
import { DialogProvider } from 'src/components/shared/dialogs/DialogProvider';
import { DEV_ENV } from 'src/config';
import { LayoutContextProvider } from 'src/hooks';
import { wrapper } from 'src/store';
import { getQueryClient } from 'src/store/queryClient';

import { appLibrary } from '../fontawesome';

const Celestia: AppComponent = ({ Component, ...rest }) => {
  const { store, props } = wrapper.useWrappedStore(rest);
  const { locale } = useRouter();
  const [disabled, setLayoutDisabled] = useState(false);
  const [queryClient] = useState(getQueryClient);
  useRef(appLibrary);

  const layoutContext = useMemo(() => ({ disabled, setLayoutDisabled }), [disabled, setLayoutDisabled]);

  return (
    <Provider store={store}>
      {}
      {/* A fixed time zone keeps next-intl's output identical on the server and in the browser (dates are formatted with date-fns, not next-intl) */}
      <NextIntlClientProvider locale={locale || 'en'} messages={props.pageProps.messages} timeZone="UTC">
        <QueryClientProvider client={queryClient}>
          <TitleManager />
          <DeployBanner />
          <ProgressIndicator />
          <LayoutContextProvider value={layoutContext}>
            <DialogProvider>
              <Layout>
                {}
                <Component {...props.pageProps} />
              </Layout>
            </DialogProvider>
          </LayoutContextProvider>
          <AuthModal />
          {DEV_ENV && <ReactQueryDevtools buttonPosition="top-right" initialIsOpen={false} />}
        </QueryClientProvider>
      </NextIntlClientProvider>
    </Provider>
  );
};

export default Celestia;
