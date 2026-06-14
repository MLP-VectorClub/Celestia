import { AppI18nNamespaces, DEFAULT_I18N_NAMESPACES } from 'src/config';

export const typedServerSideTranslations = async (locale = 'en', keys: AppI18nNamespaces[] = []) => {
  const namespaces = [...DEFAULT_I18N_NAMESPACES, ...keys];
  const messages: Record<string, unknown> = {};
  await Promise.all(
    namespaces.map(async (ns) => {
      messages[ns] = (await import(`../../public/locales/${locale}/${ns}.json`)).default;
    })
  );
  return { messages };
};
