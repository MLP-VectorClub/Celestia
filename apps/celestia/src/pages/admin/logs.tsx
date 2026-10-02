import { useQuery } from '@tanstack/react-query';
import { NextPage } from 'next';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/router';
import { FC, useState } from 'react';
import { Button, Input, Table } from 'reactstrap';

import { AdminPage } from 'src/components/admin/AdminPage';
import Pagination from 'src/components/shared/Pagination';
import TimeAgo from 'src/components/shared/TimeAgo';
import { useAuth } from 'src/hooks';
import { AdminService } from 'src/services/admin';
import { createAdminGetServerSideProps } from 'src/utils/admin-page';
import { validatePageParam } from 'src/utils/validate-page-param';

const LogDetails: FC<{ id: number }> = ({ id }) => {
  const t = useTranslations();
  const details = useQuery({ queryKey: [`/admin/logs/${id}`], queryFn: () => AdminService.logDetails(id).then((r) => r.data) });
  if (details.isLoading) return <small className="text-muted">{t('admin.loading')}</small>;
  if (details.isError || !details.data) return <small className="text-danger">{t('admin.logs.detailsFailed')}</small>;
  return (
    <pre className="mb-0 small" style={{ whiteSpace: 'pre-wrap' }}>
      {JSON.stringify(details.data.data, null, 2)}
    </pre>
  );
};

const LogsPage: NextPage = () => {
  const t = useTranslations();
  const { query, replace } = useRouter();
  const { isStaff } = useAuth();
  const page = validatePageParam(query.page);
  const type = typeof query.type === 'string' ? query.type : '';
  const initiatorId = typeof query.initiatorId === 'string' && /^\d+$/.test(query.initiatorId) ? Number(query.initiatorId) : undefined;
  const [open, setOpen] = useState<number | null>(null);
  const [typeInput, setTypeInput] = useState(type);
  const [initiatorInput, setInitiatorInput] = useState(initiatorId === undefined ? '' : String(initiatorId));

  const logs = useQuery({
    queryKey: ['/admin/logs', page, type, initiatorId],
    queryFn: () =>
      AdminService.logs({ page, ...(type ? { type } : {}), ...(initiatorId === undefined ? {} : { initiatorId }) }).then((r) => r.data),
    enabled: isStaff,
  });

  return (
    <AdminPage section="logs">
      <form
        className="d-flex flex-wrap gap-2 mb-3"
        onSubmit={(e) => {
          e.preventDefault();
          void replace({
            query: { ...(typeInput ? { type: typeInput } : {}), ...(initiatorInput ? { initiatorId: initiatorInput } : {}) },
          });
        }}
      >
        <Input
          aria-label={t('admin.logs.entryType')}
          placeholder={t('admin.logs.entryTypePlaceholder')}
          style={{ maxWidth: 260 }}
          value={typeInput}
          onChange={(e) => setTypeInput(e.target.value)}
        />
        <Input
          aria-label={t('admin.logs.initiator')}
          placeholder={t('admin.logs.initiatorPlaceholder')}
          style={{ maxWidth: 260 }}
          inputMode="numeric"
          value={initiatorInput}
          onChange={(e) => setInitiatorInput(e.target.value.replace(/\D/g, ''))}
        />
        <Button color="ui">{t('admin.logs.filter')}</Button>
      </form>
      {logs.isLoading && <p className="text-muted">{t('admin.loading')}</p>}
      {logs.isError && <p className="text-danger">{t('admin.logs.loadFailed')}</p>}
      {logs.data && (
        <>
          <Pagination {...logs.data.pagination} tooltipPos="bottom" />
          <Table responsive size="sm">
            <thead>
              <tr>
                <th>#</th>
                <th>{t('admin.logs.type')}</th>
                <th>{t('admin.logs.by')}</th>
                <th>{t('admin.logs.ip')}</th>
                <th>{t('admin.logs.when')}</th>
              </tr>
            </thead>
            <tbody>
              {logs.data.entries.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.id}</td>
                  <td>
                    {entry.hasDetails ? (
                      <Button color="link" className="p-0 align-baseline" onClick={() => setOpen(open === entry.id ? null : entry.id)}>
                        {entry.typeLabel}
                      </Button>
                    ) : (
                      entry.typeLabel
                    )}
                    {open === entry.id && <LogDetails id={entry.id} />}
                  </td>
                  <td>{entry.initiator ? entry.initiator.name : t('admin.logs.webServer')}</td>
                  <td>{entry.ip ?? ''}</td>
                  <td>
                    <TimeAgo date={entry.createdAt} />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Pagination {...logs.data.pagination} tooltipPos="top" listClassName="mb-0" />
        </>
      )}
    </AdminPage>
  );
};

export const getServerSideProps = createAdminGetServerSideProps('logs');

export default LogsPage;
