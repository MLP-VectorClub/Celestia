import { useQuery } from '@tanstack/react-query';
import { NextPage } from 'next';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Button, FormGroup, Input, Label } from 'reactstrap';

import { SidebarUsefulLink } from '@mlp-vectorclub/api-types';
import { AdminPage } from 'src/components/admin/AdminPage';
import { IconButton } from 'src/components/shared/IconButton';
import InlineIcon from 'src/components/shared/InlineIcon';
import { useDialog } from 'src/components/shared/dialogs/DialogProvider';
import { FormDialog } from 'src/components/shared/dialogs/FormDialog';
import { describeApiError, fieldErrors, useApiMutation, useAuth, useConfig } from 'src/hooks';
import { AdminService } from 'src/services/admin';
import { createAdminGetServerSideProps } from 'src/utils/admin-page';

const KEY = ['/useful-links'];

const LinkDialog = ({ link, isOpen, onClose }: { link: SidebarUsefulLink | null; isOpen: boolean; onClose: () => void }) => {
  const t = useTranslations();
  const { config } = useConfig();
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [minRole, setMinRole] = useState('user');
  useEffect(() => {
    if (!isOpen) return;
    setLabel(link?.label ?? '');
    setUrl(link?.url ?? '');
    setTitle(link?.title ?? '');
    setMinRole(link?.minRole ?? 'user');
  }, [isOpen, link]);

  const save = useApiMutation(
    () => {
      const body = { label: label.trim(), url: url.trim(), title: title.trim(), minRole };
      return link ? AdminService.updateUsefulLink(link.id, body) : AdminService.createUsefulLink(body);
    },
    { invalidate: [KEY], onSuccess: onClose }
  );
  const errors = fieldErrors(save.error);
  const err = (field: string) => errors[field] && <div className="invalid-feedback d-block">{errors[field]}</div>;

  return (
    <FormDialog
      title={link ? t('admin.links.editTitle', { label: link.label }) : t('admin.links.newTitle')}
      isOpen={isOpen}
      onClose={() => {
        save.reset();
        onClose();
      }}
      onSubmit={() => save.mutate()}
      submitLabel={link ? t('admin.links.save') : t('admin.links.create')}
      submitTestId={link ? 'dialog-btn-save-changes' : 'dialog-btn-add'}
      busy={save.isPending}
      error={save.error && Object.keys(errors).length === 0 ? describeApiError(save.error) : null}
    >
      <FormGroup>
        <Label for="link-label">{t('admin.links.labelHelp')}</Label>
        <Input
          id="link-label"
          name="label"
          maxLength={35}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          invalid={Boolean(errors.label)}
        />
        {err('label')}
      </FormGroup>
      <FormGroup>
        <Label for="link-url">{t('admin.links.url')}</Label>
        <Input
          id="link-url"
          name="url"
          maxLength={255}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          invalid={Boolean(errors.url)}
        />
        {err('url')}
      </FormGroup>
      <FormGroup>
        <Label for="link-title">{t('admin.links.tooltip')}</Label>
        <Input
          id="link-title"
          name="title"
          maxLength={255}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          invalid={Boolean(errors.title)}
        />
        {err('title')}
      </FormGroup>
      <FormGroup>
        <Label for="link-role">{t('admin.links.lowestRoleHelp')}</Label>
        <Input
          id="link-role"
          name="minRole"
          type="select"
          value={minRole}
          onChange={(e) => setMinRole(e.target.value)}
          invalid={Boolean(errors.minRole)}
        >
          {Object.entries(config?.roles ?? { user: t('common.roleLabel.user') }).map(([key, label2]) => (
            <option key={key} value={key}>
              {label2}
            </option>
          ))}
        </Input>
        {err('minRole')}
      </FormGroup>
    </FormDialog>
  );
};

const ReorderDialog = ({ links, isOpen, onClose }: { links: SidebarUsefulLink[]; isOpen: boolean; onClose: () => void }) => {
  const t = useTranslations();
  const [order, setOrder] = useState<SidebarUsefulLink[]>(links);
  useEffect(() => {
    if (isOpen) setOrder(links);
  }, [isOpen, links]);
  const save = useApiMutation(() => AdminService.orderUsefulLinks(order.map((l) => l.id)), { invalidate: [KEY], onSuccess: onClose });
  const move = (index: number, by: number) => {
    const target = index + by;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
  };

  return (
    <FormDialog
      title={t('admin.links.reorderTitle')}
      isOpen={isOpen}
      onClose={() => {
        save.reset();
        onClose();
      }}
      onSubmit={() => save.mutate()}
      submitLabel={t('admin.links.saveOrder')}
      busy={save.isPending}
      error={save.error ? describeApiError(save.error) : null}
    >
      <p>{t('admin.links.reorderHelp')}</p>
      <ol className="list-unstyled">
        {order.map((l, i) => (
          <li key={l.id} className="d-flex align-items-center gap-2 mb-1">
            <IconButton icon="arrow-up" color="darkblue" title={t('admin.links.moveUp', { label: l.label })} disabled={i === 0} onClick={() => move(i, -1)} />
            <IconButton icon="arrow-down" color="darkblue" title={t('admin.links.moveDown', { label: l.label })} disabled={i === order.length - 1} onClick={() => move(i, 1)} />
            <span>{l.label}</span>
          </li>
        ))}
      </ol>
    </FormDialog>
  );
};

const UsefulLinksPage: NextPage = () => {
  const t = useTranslations();
  const { isStaff } = useAuth();
  const { config } = useConfig();
  const { confirm } = useDialog();
  const links = useQuery({ queryKey: KEY, queryFn: () => AdminService.usefulLinks().then((r) => r.data), enabled: isStaff });
  const [editing, setEditing] = useState<SidebarUsefulLink | null | undefined>(undefined);
  const [reordering, setReordering] = useState(false);
  const remove = useApiMutation((id: number) => AdminService.deleteUsefulLink(id), { invalidate: [KEY] });
  const roleLabel = (role: string) => config?.roles?.[role as keyof typeof config.roles] ?? role;

  return (
    <AdminPage
      section="usefulLinks"
      lead={t('admin.links.lead')}
      actions={
        <>
          <Button id="add-link" color="success" onClick={() => setEditing(null)}>
            <InlineIcon icon="plus" first />
            {t('admin.links.new')}
          </Button>
          <Button color="blue" id="reorder-links" disabled={(links.data?.length ?? 0) < 2} onClick={() => setReordering(true)}>
            <InlineIcon icon="sort" first />
            {t('admin.links.reorder')}
          </Button>
        </>
      }
    >
      {remove.error && <p className="text-danger">{describeApiError(remove.error)}</p>}
      {links.isLoading && <p className="text-muted">{t('admin.loading')}</p>}
      {links.isError && <p className="text-danger">{t('admin.links.loadFailed')}</p>}
      {links.data && (
        <ol id="useful-links-list">
          {links.data.map((l) => (
            <li key={l.id} id={`link-${l.id}`}>
              <a href={l.url} title={l.title ?? undefined} className="fw-bold">
                {l.label}
              </a>
              <div>
                <InlineIcon icon="eye" first />
                {t('admin.links.andAbove', { role: roleLabel(l.minRole) })}
              </div>
              <div className="mb-1">
                <Button size="sm" color="blue" className="edit-link me-2" onClick={() => setEditing(l)}>
                  <InlineIcon icon="pencil-alt" first />
                  {t('admin.links.edit')}
                </Button>
                <Button
                  size="sm"
                  color="red"
                  className="delete-link"
                  disabled={remove.isPending}
                  onClick={async () => {
                    if (
                      await confirm({
                        title: t('admin.links.deleteTitle'),
                        body: t('admin.links.deleteBody', { label: l.label }),
                        color: 'danger',
                        confirmLabel: t('admin.links.delete'),
                      })
                    )
                      remove.mutate(l.id);
                  }}
                >
                  <InlineIcon icon="trash" first />
                  {t('admin.links.delete')}
                </Button>
              </div>
            </li>
          ))}
        </ol>
      )}
      <LinkDialog link={editing ?? null} isOpen={editing !== undefined} onClose={() => setEditing(undefined)} />
      <ReorderDialog links={links.data ?? []} isOpen={reordering} onClose={() => setReordering(false)} />
    </AdminPage>
  );
};

export const getServerSideProps = createAdminGetServerSideProps('usefulLinks');

export default UsefulLinksPage;
