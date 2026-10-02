import Link from 'next/link';
import { FC, PropsWithChildren, useMemo } from 'react';

import Content from 'src/components/shared/Content';
import StandardHeading from 'src/components/shared/StandardHeading';
import { useAuth, useTitleSetter } from 'src/hooks';
import { useAppDispatch } from 'src/store';
import { TitleFactory } from 'src/types/title';

export const ADMIN_SECTIONS = [
  { href: '/admin/logs', label: 'Logs' },
  { href: '/admin/notices', label: 'Notices' },
  { href: '/admin/useful-links', label: 'Useful links' },
  { href: '/admin/settings', label: 'Settings' },
] as const;

interface PropTypes extends PropsWithChildren {
  title: string;
}

/** Shell of the staff pages: sets the title, shows the section links and keeps non-staff visitors out */
export const AdminPage: FC<PropTypes> = ({ title, children }) => {
  const dispatch = useAppDispatch();
  const { isStaff } = useAuth();
  const titleData = useMemo<ReturnType<TitleFactory>>(
    () => ({
      title,
      breadcrumbs: [
        { label: 'Administration', linkProps: { href: '/admin' } },
        { label: title, active: true },
      ],
    }),
    [title]
  );
  useTitleSetter(dispatch, titleData);

  return (
    <Content>
      <StandardHeading heading={title} />
      {!isStaff ? (
        <p className="text-center text-muted">This page is only available to staff.</p>
      ) : (
        <>
          <nav className="d-flex flex-wrap gap-3 justify-content-center mb-4" aria-label="Administration">
            {ADMIN_SECTIONS.map((s) => (
              <Link key={s.href} href={s.href}>
                {s.label}
              </Link>
            ))}
          </nav>
          {children}
        </>
      )}
    </Content>
  );
};
