import { useQuery } from '@tanstack/react-query';
import Axios from 'axios';
import { FC, useEffect, useState } from 'react';
import { Input, Label } from 'reactstrap';

import { FormDialog } from 'src/components/shared/dialogs/FormDialog';
import { TransferItem, TransferList } from 'src/components/shared/dialogs/TransferList';
import { describeApiError, useApiMutation } from 'src/hooks';
import { ENDPOINTS } from 'src/utils';

interface RelationsData {
  unlinked?: TransferItem[];
  linked?: (TransferItem & { mutual?: boolean })[];
}
interface ShowsData {
  entries?: (TransferItem & { type?: string })[];
  linkedIds?: number[];
}

type Kind = 'relations' | 'shows';

interface PropTypes {
  appearanceId: number;
  kind: Kind;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Edits which appearances (`relations`, with an optional "mutual" flag) or shows (`shows`, staff only) an appearance is linked to
 */
export const AppearanceRelationsDialog: FC<PropTypes> = ({ appearanceId, kind, isOpen, onClose }) => {
  const [items, setItems] = useState<(TransferItem & { mutual?: boolean })[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [mutuals, setMutuals] = useState<number[]>([]);

  const source = useQuery({
    queryKey: ['appearance-links', kind, appearanceId],
    queryFn: () => Axios.get<RelationsData & ShowsData>(`/appearances/${appearanceId}/${kind}`).then((r) => r.data),
    enabled: isOpen,
    staleTime: 0,
    gcTime: 0,
  });

  useEffect(() => {
    const data = source.data;
    if (!data) return;
    if (kind === 'relations') {
      const all = [...(data.unlinked ?? []), ...(data.linked ?? [])];
      setItems(all);
      setSelected((data.linked ?? []).map((i) => i.id));
      setMutuals((data.linked ?? []).filter((i) => i.mutual).map((i) => i.id));
    } else {
      setItems(data.entries ?? []);
      setSelected(data.linkedIds ?? []);
    }
  }, [source.data, kind]);

  const save = useApiMutation(
    () =>
      Axios.put<unknown>(
        `/appearances/${appearanceId}/${kind}`,
        kind === 'relations' ? { ids: selected, mutuals: mutuals.filter((id) => selected.includes(id)) } : { ids: selected }
      ),
    { invalidate: [[ENDPOINTS.APPEARANCE({ id: appearanceId })]], onSuccess: onClose }
  );

  const byId = new Map(items.map((i) => [i.id, i]));
  const selectedItems = selected.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : []));
  const available = items.filter((i) => !selected.includes(i.id));

  return (
    <FormDialog
      title={kind === 'relations' ? 'Related appearances' : 'Featured in'}
      isOpen={isOpen}
      onClose={() => {
        save.reset();
        onClose();
      }}
      onSubmit={() => save.mutate()}
      submitLabel="Save"
      busy={save.isPending || source.isFetching}
      error={save.error ? describeApiError(save.error) : source.error ? 'The list could not be loaded.' : null}
    >
      <TransferList
        available={available}
        selected={selectedItems}
        availableTitle="Available"
        selectedTitle="Linked"
        onChange={setSelected}
        renderSelectedExtra={
          kind === 'relations'
            ? (item) => (
                <>
                  <Input
                    id={`mutual-${item.id}`}
                    type="checkbox"
                    className="me-1"
                    checked={mutuals.includes(item.id)}
                    onChange={(e) => setMutuals((c) => (e.target.checked ? [...c, item.id] : c.filter((id) => id !== item.id)))}
                  />
                  <Label for={`mutual-${item.id}`} className="me-2 small">
                    Mutual
                  </Label>
                </>
              )
            : undefined
        }
      />
    </FormDialog>
  );
};
