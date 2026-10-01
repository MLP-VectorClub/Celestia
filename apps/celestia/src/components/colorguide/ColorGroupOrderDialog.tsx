import { useQuery } from '@tanstack/react-query';
import { FC, useEffect, useState } from 'react';
import { Button, ListGroup, ListGroupItem } from 'reactstrap';

import InlineIcon from 'src/components/shared/InlineIcon';
import { FormDialog } from 'src/components/shared/dialogs/FormDialog';
import { describeApiError, useApiMutation } from 'src/hooks';
import { ColorGroupService } from 'src/services/color-groups';
import { ENDPOINTS } from 'src/utils';

interface PropTypes {
  appearanceId: number;
  isOpen: boolean;
  onClose: () => void;
}

export const ColorGroupOrderDialog: FC<PropTypes> = ({ appearanceId, isOpen, onClose }) => {
  const [groups, setGroups] = useState<{ id: number; label: string }[]>([]);
  const order = useQuery({
    queryKey: ['color-group-order', appearanceId],
    queryFn: () => ColorGroupService.getOrder(appearanceId).then((r) => r.data),
    enabled: isOpen,
    staleTime: 0,
    gcTime: 0,
  });
  useEffect(() => {
    if (order.data) setGroups((order.data.cgs ?? []).map((g) => ({ id: g.id as number, label: g.label ?? '' })));
  }, [order.data]);

  const save = useApiMutation(
    () =>
      ColorGroupService.setOrder(
        appearanceId,
        groups.map((g) => g.id)
      ),
    {
      invalidate: [[ENDPOINTS.APPEARANCE({ id: appearanceId })]],
      onSuccess: onClose,
    }
  );

  const move = (index: number, by: -1 | 1) =>
    setGroups((current) => {
      const next = [...current];
      const target = index + by;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  return (
    <FormDialog
      title="Re-order color groups"
      isOpen={isOpen}
      onClose={() => {
        save.reset();
        onClose();
      }}
      onSubmit={() => save.mutate()}
      submitLabel="Save order"
      busy={save.isPending || order.isFetching}
      error={save.error ? describeApiError(save.error) : order.error ? 'The groups could not be loaded.' : null}
    >
      <ListGroup>
        {groups.map((g, i) => (
          <ListGroupItem key={g.id} className="d-flex justify-content-between align-items-center">
            {g.label}
            <span>
              <Button type="button" size="sm" outline onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${g.label} up`}>
                <InlineIcon icon="arrow-up" />
              </Button>{' '}
              <Button
                type="button"
                size="sm"
                outline
                onClick={() => move(i, 1)}
                disabled={i === groups.length - 1}
                aria-label={`Move ${g.label} down`}
              >
                <InlineIcon icon="arrow-down" />
              </Button>
            </span>
          </ListGroupItem>
        ))}
      </ListGroup>
    </FormDialog>
  );
};
