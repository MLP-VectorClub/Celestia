import { useTranslations } from 'next-intl';
import { FC, useEffect, useState } from 'react';
import { Button, FormGroup, Input, Label } from 'reactstrap';

import InlineIcon from 'src/components/shared/InlineIcon';
import { useDialog } from 'src/components/shared/dialogs/DialogProvider';
import { FormDialog } from 'src/components/shared/dialogs/FormDialog';
import { describeApiError, fieldErrors, useApiMutation } from 'src/hooks';
import { EventEntriesService } from 'src/services/event-entries';
import { httpResponseMapper } from 'src/utils/common';

const EditDialog: FC<{ entryId: number; eventKey: string[]; isOpen: boolean; onClose: () => void }> = ({
  entryId,
  eventKey,
  isOpen,
  onClose,
}) => {
  const t = useTranslations();
  const [link, setLink] = useState('');
  const [title, setTitle] = useState('');
  const [prevSrc, setPrevSrc] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // The form is filled from the API when it opens, so what is shown is what the server has
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setLoaded(false);
    setLoadError(null);
    EventEntriesService.get(entryId)
      .then(({ data }) => {
        if (cancelled) return;
        setLink(data.link);
        setTitle(data.title);
        setPrevSrc(data.prevSrc ?? '');
        setLoaded(true);
      })
      .catch((e: unknown) => !cancelled && setLoadError(describeApiError(httpResponseMapper(e))));
    return () => {
      cancelled = true;
    };
  }, [isOpen, entryId]);

  const save = useApiMutation(
    () => EventEntriesService.update(entryId, { link: link.trim(), title: title.trim(), prevSrc: prevSrc.trim() || null }),
    { invalidate: [eventKey], onSuccess: onClose }
  );
  const errors = fieldErrors(save.error);
  const err = (field: string) => errors[field] && <div className="invalid-feedback d-block">{errors[field]}</div>;

  return (
    <FormDialog
      title={t('events.entry.editTitle')}
      isOpen={isOpen}
      onClose={() => {
        save.reset();
        onClose();
      }}
      onSubmit={() => loaded && save.mutate()}
      submitLabel={t('events.entry.save')}
      busy={save.isPending || (!loaded && !loadError)}
      error={loadError ?? (save.error && Object.keys(errors).length === 0 ? describeApiError(save.error) : null)}
    >
      <FormGroup>
        <Label for="entry-link">{t('events.entry.link')}</Label>
        <Input id="entry-link" name="link" value={link} onChange={(e) => setLink(e.target.value)} invalid={Boolean(errors.link)} />
        {err('link')}
      </FormGroup>
      <FormGroup>
        <Label for="entry-title">{t('events.entry.title')}</Label>
        <Input
          id="entry-title"
          name="title"
          maxLength={64}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          invalid={Boolean(errors.title)}
        />
        {err('title')}
      </FormGroup>
      <FormGroup>
        <Label for="entry-prev">{t('events.entry.preview')}</Label>
        <Input
          id="entry-prev"
          name="prevSrc"
          value={prevSrc}
          onChange={(e) => setPrevSrc(e.target.value)}
          invalid={Boolean(errors.prevSrc)}
        />
        {err('prevSrc')}
      </FormGroup>
    </FormDialog>
  );
};

/** Edit and withdraw buttons of an entry, shown to its author (and staff) */
export const EventEntryActions: FC<{ entryId: number; title: string; eventKey: string[] }> = ({ entryId, title, eventKey }) => {
  const t = useTranslations();
  const { confirm } = useDialog();
  const [editing, setEditing] = useState(false);
  const remove = useApiMutation(() => EventEntriesService.remove(entryId), { invalidate: [eventKey] });

  return (
    <div className="mt-2">
      <Button size="sm" color="blue" className="edit-entry me-2" title={t('events.entry.edit')} onClick={() => setEditing(true)}>
        <InlineIcon icon="pencil-alt" title={t('events.entry.edit')} />
      </Button>
      <Button
        size="sm"
        color="red"
        className="delete-entry"
        title={t('events.entry.withdraw')}
        disabled={remove.isPending}
        onClick={async () => {
          if (
            await confirm({
              title: t('events.entry.withdrawTitle'),
              body: t('events.entry.withdrawBody', { title }),
              color: 'danger',
              confirmLabel: t('events.entry.withdraw'),
            })
          )
            remove.mutate();
        }}
      >
        <InlineIcon icon="trash" title={t('events.entry.withdraw')} />
      </Button>
      {remove.error && <div className="text-danger small mt-1">{describeApiError(remove.error)}</div>}
      <EditDialog entryId={entryId} eventKey={eventKey} isOpen={editing} onClose={() => setEditing(false)} />
    </div>
  );
};
