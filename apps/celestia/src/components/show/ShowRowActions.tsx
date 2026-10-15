import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ShowListItem } from '@went.tf/mlp-vectorclub-api-types';
import { useTranslations } from 'next-intl';
import { FC, useState } from 'react';

import { IconButton } from 'src/components/shared/IconButton';
import { useDialog } from 'src/components/shared/dialogs/DialogProvider';
import { ShowFormDialog } from 'src/components/show/ShowFormDialog';
import { showFetcher } from 'src/fetchers';
import { describeApiError, useApiMutation } from 'src/hooks';
import { ShowAdminService } from 'src/services/show-admin';
import { ENDPOINTS } from 'src/utils';

const isShowList = (key: readonly unknown[]) => typeof key[0] === 'string' && (key[0] === '/show' || key[0].startsWith('/show?'));

/** Edit and delete for a row of the show lists, for staff */
export const ShowRowActions: FC<{ entry: Pick<ShowListItem, 'id' | 'type' | 'title'> }> = ({ entry }) => {
  const t = useTranslations();
  const { confirm } = useDialog();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const typeName = t(`show.index.typeNames.${entry.type}`);

  const refresh = () => queryClient.invalidateQueries({ predicate: (query) => isShowList(query.queryKey) });
  const full = useQuery({ queryKey: [ENDPOINTS.SHOW_BY_ID({ id: entry.id })], queryFn: showFetcher({ id: entry.id }), enabled: editing });
  const remove = useApiMutation(() => ShowAdminService.remove(entry.id), { onSuccess: () => void refresh() });

  const askToDelete = async () => {
    setError(null);
    const confirmed = await confirm({
      title: t('show.admin.deleteTitle'),
      body: t('show.admin.deleteBody', { title: entry.title }),
      confirmLabel: t('show.admin.delete'),
      color: 'danger',
    });
    if (!confirmed) return;
    try {
      await remove.mutateAsync();
    } catch (e) {
      setError(describeApiError(e as never));
    }
  };

  return (
    <span className="ms-2">
      <IconButton
        icon="pencil-alt"
        color="blue"
        className="edit-show"
        title={t('show.index.edit', { typeName })}
        onClick={() => setEditing(true)}
      />
      <IconButton
        icon="times"
        color="red"
        className="delete-show ms-1"
        title={t('show.index.delete', { typeName })}
        disabled={remove.isPending}
        onClick={() => void askToDelete()}
      />
      {error && <span className="text-danger ms-2">{error}</span>}
      {editing && full.data && (
        <ShowFormDialog
          category={entry.type === 'episode' ? 'episode' : 'other'}
          show={full.data.show}
          isOpen
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            void refresh();
          }}
        />
      )}
    </span>
  );
};
