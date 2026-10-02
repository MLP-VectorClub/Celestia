import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { FC, PropsWithChildren, useMemo } from 'react';

import Content from 'src/components/shared/Content';
import StandardHeading from 'src/components/shared/StandardHeading';
import { useAuth, useTitleSetter } from 'src/hooks';
import { useAppDispatch } from 'src/store';
import { TitleFactory } from 'src/types/title';

export const ADMIN_SECTIONS = [
  { href: '/admin/logs', key: 'logs' },
  { href: '/admin/notices', key: 'notices' },
  { href: '/admin/useful-links', key: 'usefulLinks' },
  { href: '/admin/settings', key: 'settings' },
] as const;

/** Names of the staff pages, also the keys under `admin.sections` */
export type AdminSection = 'index' | (typeof ADMIN_SECTIONS)[number]['key'];

export const adminTitle = (section: AdminSection): ReturnType<TitleFactory> => ({
  title: [`admin.sections.${section}`],
  breadcrumbs: [
    { label: ['admin.sections.index'], linkProps: { href: '/admin' }, ...(section === 'index' ? { active: true } : {}) },
    ...(section === 'index' ? [] : [{ label: [`admin.sections.${section}`] as [string], active: true }]),
  ],
});

interface PropTypes extends PropsWithChildren {
  section: AdminSection;
}

/** Shell of the staff pages: sets the title, shows the section links and keeps non-staff visitors out */
export const AdminPage: FC<PropTypes> = ({ section, children }) => {
  const t = useTranslations();
  const dispatch = useAppDispatch();
  const { isStaff } = useAuth();
  const titleData = useMemo(() => adminTitle(section), [section]);
  useTitleSetter(dispatch, titleData);

  return (
    <Content>
      <StandardHeading heading={t(`admin.sections.${section}`)} />
      {!isStaff ? (
        <p className="text-center text-muted">{t('admin.staffOnly')}</p>
      ) : (
        <>
          <nav className="d-flex flex-wrap gap-3 justify-content-center mb-4" aria-label={t('admin.sections.index')}>
            {ADMIN_SECTIONS.map((s) => (
              <Link key={s.href} href={s.href}>
                {t(`admin.sections.${s.key}`)}
              </Link>
            ))}
          </nav>
          {children}
        </>
      )}
    </Content>
  );
};
