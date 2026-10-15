import { useQuery } from '@tanstack/react-query';
import { GetNoticesResult, Notice } from '@went.tf/mlp-vectorclub-api-types';
import { NextPage } from 'next';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Button, FormGroup, FormText, Input, Label } from 'reactstrap';

import { AdminPage } from 'src/components/admin/AdminPage';
import { IconButton } from 'src/components/shared/IconButton';
import InlineIcon from 'src/components/shared/InlineIcon';
import Pagination from 'src/components/shared/Pagination';
import TimeAgo from 'src/components/shared/TimeAgo';
import { useDialog } from 'src/components/shared/dialogs/DialogProvider';
import { FormDialog } from 'src/components/shared/dialogs/FormDialog';
import { describeApiError, fieldErrors, useApiMutation, useAuth } from 'src/hooks';
import { AdminService } from 'src/services/admin';
import { ResourceService } from 'src/services/resource';
import { createAdminGetServerSideProps } from 'src/utils/admin-page';
import { renderNoticeHtml } from 'src/utils/notice-html';
import { validatePageParam } from 'src/utils/validate-page-param';

const NOTICE_TYPES = ['info', 'success', 'fail', 'warn', 'caution'] as const;
const NOTICE_SITES = ['all', 'celestia', 'winterchilla'] as const;

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
  const [showAfter, setShowAfter] = useState('');
  const [hideAfter, setHideAfter] = useState('');
  const [site, setSite] = useState<(typeof NOTICE_SITES)[number]>('all');
  const [type, setType] = useState<(typeof NOTICE_TYPES)[number]>('info');
  useEffect(() => {
    if (!isOpen) return;
    setMessage(notice?.messageHtml ?? '');
    setShowAfter(notice?.showAfter ? toLocalInput(notice.showAfter) : '');
    setHideAfter(notice ? toLocalInput(notice.hideAfter) : '');
    setSite(notice?.site ?? 'all');
    setType(notice?.type ?? 'info');
  }, [isOpen, notice]);

  const save = useApiMutation(
    () => {
      const body = {
        messageHtml: message.trim(),
        showAfter: showAfter ? new Date(showAfter).toISOString() : null,
        hideAfter: hideAfter ? new Date(hideAfter).toISOString() : '',
        site,
        type,
      };
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
        <FormText>{t('admin.notices.messageHelp')}</FormText>
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
        <Label for="notice-site">{t('admin.notices.site')}</Label>
        <Input id="notice-site" type="select" value={site} onChange={(e) => setSite(e.target.value as typeof site)}>
          {NOTICE_SITES.map((noticeSite) => (
            <option key={noticeSite} value={noticeSite}>
              {t(`admin.notices.sites.${noticeSite}`)}
            </option>
          ))}
        </Input>
        {err('site')}
      </FormGroup>
      <FormGroup>
        <Label for="notice-show">{t('admin.notices.showFrom')}</Label>
        <Input
          id="notice-show"
          type="datetime-local"
          value={showAfter}
          onChange={(e) => setShowAfter(e.target.value)}
          invalid={Boolean(errors.showAfter)}
        />
        {err('showAfter')}
        <FormText>{t('admin.notices.fromHelp')}</FormText>
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

type PropTypes = {
  /** The first page of the list, fetched with the visitor's session so the page does not start out as "Loading" (null when that failed) */
  initialNotices: { page: number; data: GetNoticesResult } | null;
};

const NoticesPage: NextPage<PropTypes> = ({ initialNotices }) => {
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
    // Only for the page it was fetched for, the list is refetched in the background like any other
    initialData: initialNotices?.page === page ? initialNotices.data : undefined,
  });
  const remove = useApiMutation((id: number) => AdminService.deleteNotice(id), { invalidate: [['/notices']] });

  return (
    <AdminPage
      section="notices"
      lead={t('admin.notices.lead')}
      actions={
        <Button color="success" id="create-notice" onClick={() => setEditing(null)}>
          <InlineIcon icon="plus" first />
          {t('admin.notices.create')}
        </Button>
      }
    >
      {remove.error && <p className="text-danger">{describeApiError(remove.error)}</p>}
      {notices.isLoading && <p className="text-muted">{t('admin.loading')}</p>}
      {notices.isError && <p className="text-danger">{t('admin.notices.loadFailed')}</p>}
      {notices.data && (
        <>
          <Pagination {...notices.data.pagination} tooltipPos="bottom" />
          <ul id="notice-list">
            {notices.data.notices.map((n) => (
              <li key={n.id} id={`notice-${n.id}`}>
                {renderNoticeHtml(n.messageHtml)} –{' '}
                {n.showAfter && (
                  <>
                    {t('admin.notices.scheduled')} <TimeAgo date={n.showAfter} />,{' '}
                  </>
                )}
                {t('admin.notices.hidden')} <TimeAgo date={n.hideAfter} /> ({t(`admin.notices.sites.${n.site ?? 'all'}`)}){' '}
                <IconButton
                  icon="trash"
                  color="red"
                  title={t('admin.notices.delete')}
                  disabled={remove.isPending}
                  className="delete-notice"
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
                />
                <IconButton
                  icon="pencil-alt"
                  color="blue"
                  title={t('admin.notices.edit')}
                  className="edit-notice"
                  onClick={() => setEditing(n)}
                />
              </li>
            ))}
          </ul>
          <Pagination {...notices.data.pagination} tooltipPos="top" listClassName="mb-0" />
        </>
      )}
      <NoticeDialog notice={editing ?? null} isOpen={editing !== undefined} onClose={() => setEditing(undefined)} />
    </AdminPage>
  );
};

export const getServerSideProps = createAdminGetServerSideProps('notices', 'staff', async ({ req, query }): Promise<PropTypes> => {
  const page = validatePageParam(query.page);
  try {
    const { data } = await new ResourceService(req).get<GetNoticesResult>(`/notices?page=${page}`);
    return { initialNotices: { page, data } };
  } catch {
    // The page falls back to asking from the browser
    return { initialNotices: null };
  }
});

export default NoticesPage;
