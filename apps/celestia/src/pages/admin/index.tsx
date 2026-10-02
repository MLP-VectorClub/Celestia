import { NextPage } from 'next';
import Link from 'next/link';

import { ADMIN_SECTIONS, AdminPage } from 'src/components/admin/AdminPage';
import { createAdminGetServerSideProps } from 'src/utils/admin-page';

const AdminIndexPage: NextPage = () => (
  <AdminPage title="Administration">
    <ul className="list-unstyled text-center">
      {ADMIN_SECTIONS.map((s) => (
        <li key={s.href} className="mb-2">
          <Link href={s.href}>{s.label}</Link>
        </li>
      ))}
    </ul>
  </AdminPage>
);

export const getServerSideProps = createAdminGetServerSideProps('Administration');

export default AdminIndexPage;
