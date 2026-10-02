import { useQuery } from '@tanstack/react-query';
import { NextPage } from 'next';
import { useEffect, useState } from 'react';
import { Button, FormGroup, Input, Label, Table } from 'reactstrap';

import { SidebarUsefulLink } from '@mlp-vectorclub/api-types';
import { AdminPage } from 'src/components/admin/AdminPage';
import { useDialog } from 'src/components/shared/dialogs/DialogProvider';
import { FormDialog } from 'src/components/shared/dialogs/FormDialog';
import { describeApiError, fieldErrors, useApiMutation, useAuth, useConfig } from 'src/hooks';
import { AdminService } from 'src/services/admin';
import { createAdminGetServerSideProps } from 'src/utils/admin-page';

const KEY = ['/useful-links'];

const LinkDialog = ({ link, isOpen, onClose }: { link: SidebarUsefulLink | null; isOpen: boolean; onClose: () => void }) => {
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
      title={link ? `Edit “${link.label}”` : 'New useful link'}
      isOpen={isOpen}
      onClose={() => {
        save.reset();
        onClose();
      }}
      onSubmit={() => save.mutate()}
      submitLabel={link ? 'Save link' : 'Create link'}
      busy={save.isPending}
      error={save.error && Object.keys(errors).length === 0 ? describeApiError(save.error) : null}
    >
      <FormGroup>
        <Label for="link-label">Label (3–35 characters)</Label>
        <Input id="link-label" maxLength={35} value={label} onChange={(e) => setLabel(e.target.value)} invalid={Boolean(errors.label)} />
        {err('label')}
      </FormGroup>
      <FormGroup>
        <Label for="link-url">URL</Label>
        <Input id="link-url" maxLength={255} value={url} onChange={(e) => setUrl(e.target.value)} invalid={Boolean(errors.url)} />
        {err('url')}
      </FormGroup>
      <FormGroup>
        <Label for="link-title">Tooltip (optional)</Label>
        <Input id="link-title" maxLength={255} value={title} onChange={(e) => setTitle(e.target.value)} invalid={Boolean(errors.title)} />
        {err('title')}
      </FormGroup>
      <FormGroup>
        <Label for="link-role">Lowest role that sees the link</Label>
        <Input id="link-role" type="select" value={minRole} onChange={(e) => setMinRole(e.target.value)} invalid={Boolean(errors.minRole)}>
          {Object.entries(config?.roles ?? { user: 'DeviantArt User' }).map(([key, label2]) => (
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

const UsefulLinksPage: NextPage = () => {
  const { isStaff } = useAuth();
  const { confirm } = useDialog();
  const links = useQuery({ queryKey: KEY, queryFn: () => AdminService.usefulLinks().then((r) => r.data), enabled: isStaff });
  const [editing, setEditing] = useState<SidebarUsefulLink | null | undefined>(undefined);
  const remove = useApiMutation((id: number) => AdminService.deleteUsefulLink(id), { invalidate: [KEY] });
  const reorder = useApiMutation((ids: number[]) => AdminService.orderUsefulLinks(ids), { invalidate: [KEY] });

  const move = (index: number, by: number) => {
    const ids = (links.data ?? []).map((l) => l.id);
    const target = index + by;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorder.mutate(ids);
  };
  const error = remove.error ?? reorder.error;
  const busy = remove.isPending || reorder.isPending;

  return (
    <AdminPage title="Useful links">
      <Button color="success" size="sm" className="mb-3" onClick={() => setEditing(null)}>
        New link
      </Button>
      {error && <p className="text-danger">{describeApiError(error)}</p>}
      {links.isLoading && <p className="text-muted">Loading…</p>}
      {links.isError && <p className="text-danger">Could not load the links.</p>}
      {links.data && (
        <Table responsive size="sm">
          <thead>
            <tr>
              <th>Label</th>
              <th>URL</th>
              <th>Lowest role</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {links.data.map((l, i) => (
              <tr key={l.id}>
                <td>{l.label}</td>
                <td>{l.url}</td>
                <td>{l.minRole}</td>
                <td className="text-nowrap">
                  <Button
                    size="sm"
                    color="ui"
                    className="me-1"
                    aria-label={`Move ${l.label} up`}
                    disabled={busy || i === 0}
                    onClick={() => move(i, -1)}
                  >
                    ↑
                  </Button>
                  <Button
                    size="sm"
                    color="ui"
                    className="me-1"
                    aria-label={`Move ${l.label} down`}
                    disabled={busy || i === links.data.length - 1}
                    onClick={() => move(i, 1)}
                  >
                    ↓
                  </Button>
                  <Button size="sm" color="ui" className="me-1" onClick={() => setEditing(l)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    color="danger"
                    outline
                    disabled={busy}
                    onClick={async () => {
                      if (
                        await confirm({
                          title: 'Delete link',
                          body: `“${l.label}” will be deleted.`,
                          color: 'danger',
                          confirmLabel: 'Delete',
                        })
                      )
                        remove.mutate(l.id);
                    }}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <LinkDialog link={editing ?? null} isOpen={editing !== undefined} onClose={() => setEditing(undefined)} />
    </AdminPage>
  );
};

export const getServerSideProps = createAdminGetServerSideProps('Useful links');

export default UsefulLinksPage;
