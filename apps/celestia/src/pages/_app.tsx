import '../app.scss';

import { QueryClientProvider } from '@tanstack/react-query';
import { NextIntlClientProvider } from 'next-intl';
import { AppComponent } from 'next/dist/shared/lib/router/router';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useMemo, useRef, useState } from 'react';
import { Provider } from 'react-redux';

import Layout from 'src/components/Layout';
import ProgressIndicator from 'src/components/ProgressIndicator';
import { TestConsoleCapture } from 'src/components/TestConsoleCapture';
import TitleManager from 'src/components/TitleManager';
import AuthModal from 'src/components/modals/AuthModal';
import DeployBanner from 'src/components/shared/DeployBanner';
import { FetchFailureView } from 'src/components/shared/FetchFailureView';
import { DialogProvider } from 'src/components/shared/dialogs/DialogProvider';
import { DEV_ENV } from 'src/config';
import { LayoutContextProvider, SidebarWidgetProvider } from 'src/hooks';
import { useSavedTheme } from 'src/hooks/theme';
import { wrapper } from 'src/store';
import { getQueryClient } from 'src/store/queryClient';

import { appLibrary } from '../fontawesome';

// The devtools are loaded by development builds only. The condition has to be this literal `process.env.NODE_ENV` check, which the bundler folds, so
// a production build drops the import (an imported-but-unused package would stay in the bundle) and the package can be a dev dependency
const ReactQueryDevtools =
  process.env.NODE_ENV !== 'production'
    ? dynamic(() => import('@tanstack/react-query-devtools').then((module) => module.ReactQueryDevtools), { ssr: false })
    : () => null;

const Celestia: AppComponent = ({ Component, ...rest }) => {
  const { store, props } = wrapper.useWrappedStore(rest);
  const { locale } = useRouter();
  const [disabled, setLayoutDisabled] = useState(false);
  const [queryClient] = useState(getQueryClient);
  useRef(appLibrary);
  useSavedTheme();

  const layoutContext = useMemo(() => ({ disabled, setLayoutDisabled }), [disabled, setLayoutDisabled]);

  return (
    <Provider store={store}>
      {}
      {/* A fixed time zone keeps next-intl's output identical on the server and in the browser (dates are formatted with date-fns, not next-intl) */}
      <NextIntlClientProvider locale={locale || 'en'} messages={props.pageProps.messages} timeZone="UTC">
        <QueryClientProvider client={queryClient}>
          <TestConsoleCapture />
          <TitleManager />
          <DeployBanner />
          <ProgressIndicator />
          <LayoutContextProvider value={layoutContext}>
            <DialogProvider>
              <SidebarWidgetProvider>
                <Layout mainPadding={props.pageProps.mainPadding !== false}>
                  {}
                  {props.pageProps.fetchFailure ? (
                    <FetchFailureView failure={props.pageProps.fetchFailure} />
                  ) : (
                    <Component {...props.pageProps} />
                  )}
                </Layout>
              </SidebarWidgetProvider>
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
