import { NextIntlClientProvider } from 'next-intl';
import { FC, PropsWithChildren } from 'react';

const modules = import.meta.glob('../../public/locales/en/*.json', { eager: true }) as Record<string, { default: unknown }>;

/** Every English namespace, as the pages load them in the app */
export const englishMessages: Record<string, unknown> = Object.fromEntries(
  Object.entries(modules).map(([path, module]) => [
    path
      .split('/')
      .pop()!
      .replace(/\.json$/, ''),
    module.default,
  ])
);

/** Wraps components in the translation context the app provides, for tests that render them on their own */
export const IntlTestProvider: FC<PropsWithChildren> = ({ children }) => (
  <NextIntlClientProvider locale="en" messages={englishMessages} timeZone="UTC">
    {children}
  </NextIntlClientProvider>
);
