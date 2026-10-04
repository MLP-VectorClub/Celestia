import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { FC, RefObject, useRef, useState } from 'react';
import { UncontrolledTooltip } from 'reactstrap';

import { ShowListItem } from '@mlp-vectorclub/api-types';
import InlineIcon from 'src/components/shared/InlineIcon';
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
  const editButtonRef = useRef<HTMLButtonElement>(null) as RefObject<HTMLButtonElement>;
  const deleteButtonRef = useRef<HTMLButtonElement>(null) as RefObject<HTMLButtonElement>;
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
      <button
        type="button"
        className="edit-show btn btn-link p-2 text-info faded"
        ref={editButtonRef}
        onClick={() => setEditing(true)}
        aria-label={t('show.index.edit', { typeName })}
      >
        <InlineIcon icon="pencil-alt" />
      </button>
      <UncontrolledTooltip target={editButtonRef} fade={false} placement="top">
        {t('show.index.edit', { typeName })}
      </UncontrolledTooltip>
      <button
        type="button"
        className="delete-show btn btn-link p-2 text-danger faded"
        ref={deleteButtonRef}
        onClick={() => void askToDelete()}
        disabled={remove.isPending}
        aria-label={t('show.index.delete', { typeName })}
      >
        <InlineIcon icon="times" />
      </button>
      <UncontrolledTooltip target={deleteButtonRef} fade={false} placement="top">
        {t('show.index.delete', { typeName })}
      </UncontrolledTooltip>
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
