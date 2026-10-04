import { useQuery } from '@tanstack/react-query';
import { NextPage } from 'next';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Table } from 'reactstrap';

import { AdminPage } from 'src/components/admin/AdminPage';
import Pagination from 'src/components/shared/Pagination';
import TimeAgo from 'src/components/shared/TimeAgo';
import { useAuth } from 'src/hooks';
import { PATHS } from 'src/paths';
import { AdminService } from 'src/services/admin';
import { createAdminGetServerSideProps } from 'src/utils/admin-page';
import { validatePageParam } from 'src/utils/validate-page-param';

/** Every personal guide appearance of every user, newest first, for staff */
const PcgAppearancesPage: NextPage = () => {
  const t = useTranslations();
  const { query } = useRouter();
  const { isStaff } = useAuth();
  const page = validatePageParam(query.page);
  const list = useQuery({
    queryKey: ['/admin/pcg-appearances', page],
    queryFn: () => AdminService.pcgAppearances({ page }).then((r) => r.data),
    enabled: isStaff,
  });

  return (
    <AdminPage section="pcgAppearances">
      {list.isLoading && <p className="text-muted">{t('admin.loading')}</p>}
      {list.isError && <p className="text-danger">{t('admin.pcg.loadFailed')}</p>}
      {list.data && list.data.appearances.length === 0 && <p className="text-muted">{t('admin.pcg.empty')}</p>}
      {list.data && list.data.appearances.length > 0 && (
        <>
          <Pagination {...list.data.pagination} tooltipPos="bottom" />
          <Table responsive size="sm">
            <thead>
              <tr>
                <th>#</th>
                <th>{t('admin.pcg.label')}</th>
                <th>{t('admin.pcg.owner')}</th>
                <th>{t('admin.pcg.created')}</th>
              </tr>
            </thead>
            <tbody>
              {list.data.appearances.map((a) => (
                <tr key={a.id}>
                  <td>{a.id}</td>
                  <td>
                    <Link href={PATHS.PCG_APPEARANCE(a.ownerId, a)}>{a.label}</Link>
                    {a.private && <small className="text-muted ms-2">{t('admin.pcg.private')}</small>}
                  </td>
                  <td>
                    <Link href={PATHS.USER_PCG(a.ownerId)}>#{a.ownerId}</Link>
                  </td>
                  <td>
                    <TimeAgo date={a.createdAt} />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Pagination {...list.data.pagination} tooltipPos="top" listClassName="mb-0" />
        </>
      )}
    </AdminPage>
  );
};

export const getServerSideProps = createAdminGetServerSideProps('pcgAppearances');

export default PcgAppearancesPage;
