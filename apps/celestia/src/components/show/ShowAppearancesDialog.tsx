import { useQuery } from '@tanstack/react-query';
import Axios from 'axios';
import { useTranslations } from 'next-intl';
import { FC, useEffect, useState } from 'react';

import { FormDialog } from 'src/components/shared/dialogs/FormDialog';
import { TransferItem, TransferList } from 'src/components/shared/dialogs/TransferList';
import { describeApiError, useApiMutation } from 'src/hooks';
import { ENDPOINTS } from 'src/utils';

interface ShowAppearances {
  entries: Array<TransferItem & { guide?: string | null }>;
  linkedIds: number[];
}

interface PropTypes {
  showId: number;
  isOpen: boolean;
  onClose: () => void;
}

/** Staff pick which color guide entries are linked to a show, they are listed on its page as related appearances */
export const ShowAppearancesDialog: FC<PropTypes> = ({ showId, isOpen, onClose }) => {
  const t = useTranslations();
  const [selected, setSelected] = useState<number[]>([]);
  const source = useQuery({
    queryKey: ['show-appearances', showId],
    queryFn: () => Axios.get<ShowAppearances>(`/show/${showId}/appearances`).then((r) => r.data),
    enabled: isOpen,
    staleTime: 0,
    gcTime: 0,
  });
  useEffect(() => {
    if (source.data) setSelected(source.data.linkedIds);
  }, [source.data]);

  const save = useApiMutation(() => Axios.put<unknown>(`/show/${showId}/appearances`, { ids: selected }), {
    invalidate: [[ENDPOINTS.SHOW_BY_ID({ id: showId })]],
    onSuccess: onClose,
  });

  const entries = source.data?.entries ?? [];
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const selectedItems = selected.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : []));
  const available = entries.filter((entry) => !selected.includes(entry.id));

  return (
    <FormDialog
      title={t('show.entry.guideRelations')}
      isOpen={isOpen}
      onClose={() => {
        save.reset();
        onClose();
      }}
      onSubmit={() => save.mutate()}
      submitLabel={t('show.entry.saveText')}
      busy={save.isPending || source.isFetching}
      error={save.error ? describeApiError(save.error) : source.error ? t('show.entry.loadTextFailed') : null}
    >
      <TransferList
        available={available}
        selected={selectedItems}
        availableTitle={t('show.entry.unlinked')}
        selectedTitle={t('show.entry.linked')}
        onChange={setSelected}
      />
    </FormDialog>
  );
};
