import { useQuery } from '@tanstack/react-query';
import { NextPage } from 'next';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FC, useEffect, useMemo, useState } from 'react';
import { Button, Input } from 'reactstrap';

import { AdminPage } from 'src/components/admin/AdminPage';
import InlineIcon from 'src/components/shared/InlineIcon';
import Pagination from 'src/components/shared/Pagination';
import TimeAgo from 'src/components/shared/TimeAgo';
import { PATHS } from 'src/paths';
import { useAuth } from 'src/hooks';
import { AdminService } from 'src/services/admin';
import { formatLongDate } from 'src/utils';
import { createAdminGetServerSideProps } from 'src/utils/admin-page';
import { validatePageParam } from 'src/utils/validate-page-param';

const PAGE_SIZE = 40;
const FILTER_PROPS = ['type', 'by'];

type Pair = { label: string; old: unknown; new: unknown };
type Row = { label: string; value: unknown };

const humanize = (key: string) => key.replace(/[_-]+/g, ' ').replace(/^./, (c) => c.toUpperCase());

/** Logged values are often JSON inside a string (`changes`), open those up so they read as rows */
const expand = (data: Record<string, unknown>): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (typeof value === 'string' && /^[{[]/.test(value.trim())) {
      try {
        const parsed: unknown = JSON.parse(value);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          Object.entries(parsed as Record<string, unknown>).forEach(([k, v]) => (out[k] = v));
          return;
        }
      } catch {
        /* a plain string that happens to start with a bracket */
      }
    }
    out[key] = value;
  });
  return out;
};

/** Splits the data into plain rows and old/new pairs (`oldrole` + `newrole`, `olddata` + `newdata`), the pairs get the diff switch */
export const splitLogData = (data: Record<string, unknown>): { rows: Row[]; pairs: Pair[] } => {
  const flat = expand(data);
  const pairs: Pair[] = [];
  const used = new Set<string>();
  Object.keys(flat).forEach((key) => {
    const match = /^old(.+)$/.exec(key);
    if (match && `new${match[1]}` in flat) {
      pairs.push({ label: humanize(match[1]), old: flat[key], new: flat[`new${match[1]}`] });
      used.add(key);
      used.add(`new${match[1]}`);
    }
  });
  const rows = Object.entries(flat)
    .filter(([key]) => !used.has(key))
    .map(([key, value]) => ({ label: humanize(key), value }));
  return { rows, pairs };
};

const show = (value: unknown): string => (value === null || value === undefined || value === '' ? '—' : typeof value === 'object' ? JSON.stringify(value) : String(value));

const VIEW_STATES = [
  { color: 'darkblue', key: 'diff', ins: true, del: true },
  { color: 'success', key: 'new', ins: true, del: false },
  { color: 'danger', key: 'old', ins: false, del: true },
] as const;

const LogDetails: FC<{ id: number }> = ({ id }) => {
  const t = useTranslations();
  const [view, setView] = useState(0);
  const details = useQuery({ queryKey: [`/admin/logs/${id}`], queryFn: () => AdminService.logDetails(id).then((r) => r.data) });
  const { rows, pairs } = useMemo(() => splitLogData((details.data?.data ?? {}) as Record<string, unknown>), [details.data]);
  if (details.isLoading) return <small className="text-muted">{t('admin.loading')}</small>;
  if (details.isError || !details.data) return <small className="text-danger">{t('admin.logs.detailsFailed')}</small>;
  const state = VIEW_STATES[view];

  return (
    <div className="expandable-section text-start small">
      {rows.map((row) => (
        <div key={row.label}>
          <strong>{row.label}:</strong> {show(row.value)}
        </div>
      ))}
      {pairs.length > 0 && (
        <div className="mt-1">
          <Button
            color={state.color}
            size="sm"
            className="view-switch"
            title={t('admin.logs.viewSwitch')}
            onClick={() => setView((view + 1) % VIEW_STATES.length)}
          >
            {t(`admin.logs.view.${state.key}`)}
          </Button>
          {pairs.map((pair) => (
            <div key={pair.label}>
              <strong>{pair.label}:</strong>{' '}
              {state.del && <del className="text-danger">{show(pair.old)}</del>} {state.ins && <ins className="text-success">{show(pair.new)}</ins>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const LogsPage: NextPage = () => {
  const t = useTranslations();
  const { query, replace } = useRouter();
  const { isStaff } = useAuth();
  const page = validatePageParam(query.page);
  const type = typeof query.type === 'string' ? query.type : '';
  const by = typeof query.by === 'string' ? query.by : '';
  const [open, setOpen] = useState<number | null>(null);
  const [typeInput, setTypeInput] = useState(type);
  const [byInput, setByInput] = useState(by);
  useEffect(() => {
    setTypeInput(type);
    setByInput(by);
  }, [type, by]);

  const logs = useQuery({
    queryKey: ['/admin/logs', page, type, by],
    queryFn: () => AdminService.logs({ page, size: PAGE_SIZE, ...(type ? { type } : {}), ...(by ? { by } : {}) } as never).then((r) => r.data),
    enabled: isStaff,
  });
  const entryTypes = (logs.data as { entryTypes?: Record<string, string> } | undefined)?.entryTypes ?? {};
  const filter = (next: { type?: string; by?: string }) => {
    const merged = { type: next.type ?? typeInput, by: next.by ?? byInput };
    void replace({ query: { ...(merged.type ? { type: merged.type } : {}), ...(merged.by ? { by: merged.by } : {}) } });
  };

  return (
    <AdminPage section="logs" lead={t('admin.logs.perPage', { count: PAGE_SIZE })}>
      <form
        id="filter-form"
        className="d-flex flex-wrap gap-2 justify-content-center align-items-center mb-3"
        onSubmit={(e) => {
          e.preventDefault();
          filter({});
        }}
        onReset={(e) => {
          e.preventDefault();
          setTypeInput('');
          setByInput('');
          filter({ type: '', by: '' });
        }}
      >
        <strong>{t('admin.logs.show')}</strong>
        <Input type="select" name="type" aria-label={t('admin.logs.entryType')} style={{ width: 'auto' }} value={typeInput} onChange={(e) => setTypeInput(e.target.value)}>
          <option value="">{t('admin.logs.all')}</option>
          <optgroup label={t('admin.logs.specificType')}>
            {Object.entries(entryTypes).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </optgroup>
        </Input>
        <strong>{t('admin.logs.entriesFrom')}</strong>
        <Input name="by" aria-label={t('admin.logs.initiator')} list="from_values" placeholder={t('admin.logs.byPlaceholder')} maxLength={45} style={{ width: '14rem' }} value={byInput} onChange={(e) => setByInput(e.target.value)} />
        <datalist id="from_values">
          <option>Web server</option>
          <option>you</option>
          <option>your IP</option>
        </datalist>
        <Button color="blue" title={t('admin.logs.apply')} aria-label={t('admin.logs.apply')}>
          <InlineIcon icon="search" />
        </Button>
        <Button type="reset" color="orange" title={t('admin.logs.clear')} aria-label={t('admin.logs.clear')} disabled={!type && !by}>
          <InlineIcon icon="times" />
        </Button>
      </form>
      {logs.isLoading && <p className="text-muted text-center">{t('admin.loading')}</p>}
      {logs.isError && <p className="text-danger text-center">{t('admin.logs.loadFailed')}</p>}
      {logs.data && (
        <>
          <Pagination {...logs.data.pagination} relevantProps={FILTER_PROPS} tooltipPos="bottom" />
          <table id="logs" className="table table-sm text-center">
            <thead>
              <tr>
                <th className="entryid">#</th>
                <th className="timestamp">{t('admin.logs.timestamp')}</th>
                <th className="ip">{t('admin.logs.initiatorColumn')}</th>
                <th className="entry-type">{t('admin.logs.event')}</th>
              </tr>
            </thead>
            <tbody>
              {logs.data.entries.length === 0 && (
                <tr>
                  <td colSpan={4}>
                    <div className="alert alert-info text-center mb-0">{t('admin.logs.none')}</div>
                  </td>
                </tr>
              )}
              {logs.data.entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="entryid" style={{ fontSize: '1.7rem' }}>
                    {entry.id}
                  </td>
                  <td className="timestamp">
                    {formatLongDate(new Date(entry.createdAt))}
                    <br />
                    <em>
                      <TimeAgo date={entry.createdAt} />
                    </em>
                  </td>
                  <td className="ip">
                    <Button color="link" size="sm" className="p-0 me-1 search-user" title={t('admin.logs.searchBy')} onClick={() => filter({ by: entry.initiator?.name ?? 'Web server' })}>
                      <InlineIcon icon="search" size="sm" />
                    </Button>
                    {entry.initiator ? (
                      <>
                        <Link href={PATHS.USER(entry.initiator.id)} title={t('admin.logs.visitProfile')} className="me-1">
                          <InlineIcon icon="user" size="sm" />
                        </Link>
                        <span className="name">{entry.initiator.name}</span>
                      </>
                    ) : (
                      <span className="name">{t('admin.logs.webServer')}</span>
                    )}
                    <br />
                    {entry.ip && (
                      <>
                        <Button color="link" size="sm" className="p-0 me-1 search-ip" title={t('admin.logs.searchIp')} onClick={() => filter({ by: entry.ip as string })}>
                          <InlineIcon icon="search" size="sm" />
                        </Button>
                        <span className="address">{entry.ip}</span>
                      </>
                    )}
                  </td>
                  <td className="entry-type">
                    {entry.hasDetails ? (
                      <Button color="ui" size="sm" className="expand-section" onClick={() => setOpen(open === entry.id ? null : entry.id)} aria-expanded={open === entry.id}>
                        <InlineIcon icon={open === entry.id ? 'minus' : 'plus'} first />
                        {entry.typeLabel}
                      </Button>
                    ) : (
                      entry.typeLabel
                    )}
                    {open === entry.id && <LogDetails id={entry.id} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination {...logs.data.pagination} relevantProps={FILTER_PROPS} tooltipPos="top" listClassName="mb-0" />
        </>
      )}
    </AdminPage>
  );
};

export const getServerSideProps = createAdminGetServerSideProps('logs');

export default LogsPage;
