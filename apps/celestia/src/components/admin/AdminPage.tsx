import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { FC, PropsWithChildren, ReactNode, useMemo } from 'react';
import { Button } from 'reactstrap';

import ButtonCollection from 'src/components/shared/ButtonCollection';
import Content from 'src/components/shared/Content';
import InlineIcon from 'src/components/shared/InlineIcon';
import StandardHeading from 'src/components/shared/StandardHeading';
import { useAuth, useTitleSetter } from 'src/hooks';
import { useAppDispatch } from 'src/store';
import { TitleFactory } from 'src/types/title';

/** The pages behind the buttons of the admin area, in the old site's order */
export const ADMIN_SECTIONS = [
  { href: '/admin/logs', key: 'logs', icon: 'file-alt' },
  { href: '/admin/notices', key: 'notices', icon: 'info-circle' },
  { href: '/admin/usefullinks', key: 'usefulLinks', icon: 'link' },
  { href: '/admin/pcg-appearances', key: 'pcgAppearances', icon: 'user' },
] as const;

/** Developer-only pages, listed after the others for developers */
export const DEVELOPER_SECTIONS = [{ href: '/admin/wsdiag', key: 'wsdiag', icon: 'code' }] as const;

/** Names of the staff pages, also the keys under `admin.sections` */
export type AdminSection = 'index' | (typeof ADMIN_SECTIONS)[number]['key'] | (typeof DEVELOPER_SECTIONS)[number]['key'];

export const adminTitle = (section: AdminSection): ReturnType<TitleFactory> => ({
  title: [`admin.sections.${section}`],
  breadcrumbs: [
    { label: ['admin.sections.index'], linkProps: { href: '/admin' }, ...(section === 'index' ? { active: true } : {}) },
    ...(section === 'index' ? [] : [{ label: [`admin.sections.${section}`] as [string], active: true }]),
  ],
});

interface PropTypes extends PropsWithChildren {
  section: AdminSection;
  /** The line under the heading */
  lead?: ReactNode;
  /** Buttons of the page, shown before "Back to Admin Area" */
  actions?: ReactNode;
}

/** Shell of the staff pages: the heading, a "Back to Admin Area" button and a guard that keeps non-staff visitors out */
export const AdminPage: FC<PropTypes> = ({ section, lead, actions, children }) => {
  const t = useTranslations();
  const dispatch = useAppDispatch();
  const { isStaff } = useAuth();
  const titleData = useMemo(() => adminTitle(section), [section]);
  useTitleSetter(dispatch, titleData);

  return (
    <Content>
      <StandardHeading heading={t(`admin.sections.${section}`)} lead={lead ?? (section === 'index' ? t('admin.indexLead') : undefined)} />
      {!isStaff ? (
        <p className="text-center text-muted">{t('admin.staffOnly')}</p>
      ) : (
        <>
          {section !== 'index' && (
            <ButtonCollection>
              {actions}
              <Button tag={Link} href="/admin" color="guide-link">
                <InlineIcon icon="arrow-circle-left" first />
                {t('admin.back')}
              </Button>
            </ButtonCollection>
          )}
          {children}
        </>
      )}
    </Content>
  );
};
