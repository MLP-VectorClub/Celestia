import { useQuery } from '@tanstack/react-query';
import { NextPage } from 'next';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Button, FormGroup, FormText, Input, Label, Table } from 'reactstrap';

import { Notice } from '@mlp-vectorclub/api-types';
import { AdminPage } from 'src/components/admin/AdminPage';
import Pagination from 'src/components/shared/Pagination';
import TimeAgo from 'src/components/shared/TimeAgo';
import { useDialog } from 'src/components/shared/dialogs/DialogProvider';
import { FormDialog } from 'src/components/shared/dialogs/FormDialog';
import { describeApiError, fieldErrors, useApiMutation, useAuth } from 'src/hooks';
import { AdminService } from 'src/services/admin';
import { createAdminGetServerSideProps } from 'src/utils/admin-page';
import { validatePageParam } from 'src/utils/validate-page-param';

const NOTICE_TYPES = ['info', 'success', 'fail', 'warn', 'caution'] as const;

const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

interface DialogProps {
  /** `null` creates a notice */
  notice: Notice | null;
  isOpen: boolean;
  onClose: () => void;
}

const NoticeDialog = ({ notice, isOpen, onClose }: DialogProps) => {
  const t = useTranslations();
  const [message, setMessage] = useState('');
  const [hideAfter, setHideAfter] = useState('');
  const [type, setType] = useState<(typeof NOTICE_TYPES)[number]>('info');
  useEffect(() => {
    if (!isOpen) return;
    setMessage(notice?.messageHtml ?? '');
    setHideAfter(notice ? toLocalInput(notice.hideAfter) : '');
    setType(notice?.type ?? 'info');
  }, [isOpen, notice]);

  const save = useApiMutation(
    () => {
      const body = { messageHtml: message.trim(), hideAfter: hideAfter ? new Date(hideAfter).toISOString() : '', type };
      return notice ? AdminService.updateNotice(notice.id, body) : AdminService.createNotice(body);
    },
    { invalidate: [['/notices']], onSuccess: onClose }
  );
  const errors = fieldErrors(save.error);
  const err = (field: string) => errors[field] && <div className="invalid-feedback d-block">{errors[field]}</div>;

  return (
    <FormDialog
      title={notice ? t('admin.notices.editTitle', { id: notice.id }) : t('admin.notices.new')}
      isOpen={isOpen}
      onClose={() => {
        save.reset();
        onClose();
      }}
      onSubmit={() => save.mutate()}
      submitLabel={notice ? t('admin.notices.save') : t('admin.notices.create')}
      busy={save.isPending}
      error={save.error && Object.keys(errors).length === 0 ? describeApiError(save.error) : null}
    >
      <FormGroup>
        <Label for="notice-message">{t('admin.notices.message')}</Label>
        <Input
          id="notice-message"
          type="textarea"
          rows={4}
          maxLength={500}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          invalid={Boolean(errors.messageHtml)}
        />
        {err('messageHtml')}
      </FormGroup>
      <FormGroup>
        <Label for="notice-type">{t('admin.notices.type')}</Label>
        <Input id="notice-type" type="select" value={type} onChange={(e) => setType(e.target.value as typeof type)}>
          {NOTICE_TYPES.map((noticeType) => (
            <option key={noticeType} value={noticeType}>
              {t(`admin.notices.types.${noticeType}`)}
            </option>
          ))}
        </Input>
        {err('type')}
      </FormGroup>
      <FormGroup>
        <Label for="notice-hide">{t('admin.notices.showUntil')}</Label>
        <Input
          id="notice-hide"
          type="datetime-local"
          value={hideAfter}
          onChange={(e) => setHideAfter(e.target.value)}
          invalid={Boolean(errors.hideAfter)}
        />
        {err('hideAfter')}
        <FormText>{t('admin.notices.untilHelp')}</FormText>
      </FormGroup>
    </FormDialog>
  );
};

const NoticesPage: NextPage = () => {
  const t = useTranslations();
  const { query } = useRouter();
  const { isStaff } = useAuth();
  const { confirm } = useDialog();
  const page = validatePageParam(query.page);
  const [editing, setEditing] = useState<Notice | null | undefined>(undefined);
  const notices = useQuery({
    queryKey: ['/notices', page],
    queryFn: () => AdminService.notices({ page }).then((r) => r.data),
    enabled: isStaff,
  });
  const remove = useApiMutation((id: number) => AdminService.deleteNotice(id), { invalidate: [['/notices']] });

  return (
    <AdminPage section="notices">
      <Button color="success" size="sm" className="mb-3" onClick={() => setEditing(null)}>
        {t('admin.notices.new')}
      </Button>
      {remove.error && <p className="text-danger">{describeApiError(remove.error)}</p>}
      {notices.isLoading && <p className="text-muted">{t('admin.loading')}</p>}
      {notices.isError && <p className="text-danger">{t('admin.notices.loadFailed')}</p>}
      {notices.data && (
        <>
          <Pagination {...notices.data.pagination} tooltipPos="bottom" />
          <Table responsive size="sm">
            <thead>
              <tr>
                <th>{t('admin.notices.type')}</th>
                <th>{t('admin.notices.messageSource')}</th>
                <th>{t('admin.notices.shownUntil')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {notices.data.notices.map((n) => (
                <tr key={n.id}>
                  <td>{t(`admin.notices.types.${n.type}`)}</td>
                  <td>
                    <code>{n.messageHtml}</code>
                  </td>
                  <td>
                    <TimeAgo date={n.hideAfter} />
                  </td>
                  <td className="text-nowrap">
                    <Button size="sm" color="ui" className="me-1" onClick={() => setEditing(n)}>
                      {t('admin.notices.edit')}
                    </Button>
                    <Button
                      size="sm"
                      color="danger"
                      outline
                      disabled={remove.isPending}
                      onClick={async () => {
                        if (
                          await confirm({
                            title: t('admin.notices.deleteTitle'),
                            body: t('admin.notices.deleteBody', { id: n.id }),
                            color: 'danger',
                            confirmLabel: t('admin.notices.delete'),
                          })
                        )
                          remove.mutate(n.id);
                      }}
                    >
                      {t('admin.notices.delete')}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Pagination {...notices.data.pagination} tooltipPos="top" listClassName="mb-0" />
        </>
      )}
      <NoticeDialog notice={editing ?? null} isOpen={editing !== undefined} onClose={() => setEditing(undefined)} />
    </AdminPage>
  );
};

export const getServerSideProps = createAdminGetServerSideProps('notices');

export default NoticesPage;
