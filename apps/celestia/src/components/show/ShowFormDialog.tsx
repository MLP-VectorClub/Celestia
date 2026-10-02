import { AxiosResponse } from 'axios';
import { useTranslations } from 'next-intl';
import { FC, useEffect, useState } from 'react';
import { FormGroup, FormText, Input, Label } from 'reactstrap';

import { FormDialog } from 'src/components/shared/dialogs/FormDialog';
import { describeApiError, fieldErrors, useApiMutation, useConfig } from 'src/hooks';
import { PATHS } from 'src/paths';
import { ShowAdminService } from 'src/services/show-admin';
import { ShowEntry } from 'src/types/api-alias';
import { ENDPOINTS } from 'src/utils';

interface PropTypes {
  /** What the dialog creates when `show` is not given: an episode or one of the other show types */
  category: 'episode' | 'other';
  /** Edits this show instead of creating a new one */
  show?: ShowEntry;
  isOpen: boolean;
  onClose: () => void;
  /** Called with the path of the created or updated show */
  onSaved: (path: string) => void;
}

const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** The air time is picked in the visitor's time zone and sent as an absolute timestamp */
const DEFAULT_AIR_TIME = '16:00';

export const ShowFormDialog: FC<PropTypes> = ({ category, show, isOpen, onClose, onSaved }) => {
  const t = useTranslations();
  const { config } = useConfig();
  const isEpisode = show ? show.type === 'episode' : category === 'episode';
  const otherTypes = Object.entries(config?.showTypes ?? {}).filter(([key]) => key !== 'episode');

  const [type, setType] = useState('');
  const [season, setSeason] = useState('');
  const [episode, setEpisode] = useState('');
  const [twoparter, setTwoparter] = useState(false);
  const [no, setNo] = useState('');
  const [title, setTitle] = useState('');
  const [airs, setAirs] = useState('');
  const [notes, setNotes] = useState('');

  const prefill = useApiMutation(() => ShowAdminService.prefill(), {
    onSuccess: (data) => {
      setSeason(String(data.season));
      setEpisode(String(data.episode));
      setNo(String(data.no));
      setAirs(`${data.airday}T${DEFAULT_AIR_TIME}`);
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    setType(show?.type ?? (category === 'episode' ? 'episode' : 'movie'));
    setSeason(show?.season?.toString() ?? '');
    setEpisode(show?.episode?.toString() ?? '');
    setTwoparter(show ? show.parts > 1 : false);
    setNo(show?.no?.toString() ?? '');
    setTitle(show?.title ?? '');
    setAirs(show?.airs ? toLocalInput(show.airs) : '');
    setNotes(show?.notes ?? '');
    if (!show && category === 'episode') prefill.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const save = useApiMutation(
    async () => {
      const body = {
        type,
        title: title.trim(),
        airs: airs ? new Date(airs).toISOString() : '',
        notes: notes.trim() || null,
        ...(no ? { no: Number(no) } : {}),
        ...(isEpisode ? { season: Number(season), episode: Number(episode), twoparter: Number(twoparter) as unknown as boolean } : {}),
      };
      return (show ? ShowAdminService.update(show.id, body) : ShowAdminService.create(body)) as Promise<AxiosResponse<{ id?: number }>>;
    },
    {
      invalidate: show ? [[ENDPOINTS.SHOW_BY_ID({ id: show.id })]] : [],
      onSuccess: (data) => {
        const id = show?.id ?? data?.id ?? 0;
        onSaved(
          PATHS.EPISODE({
            id,
            type,
            season: isEpisode ? Number(season) : null,
            episode: isEpisode ? Number(episode) : null,
            parts: twoparter ? 2 : 1,
            title: title.trim(),
          })
        );
      },
    }
  );
  const errors = fieldErrors(save.error);
  const error = save.error ?? prefill.error;
  const err = (field: string) => errors[field] && <div className="invalid-feedback d-block">{errors[field]}</div>;

  return (
    <FormDialog
      title={show ? t('show.admin.editTitle', { title: show.title }) : isEpisode ? t('show.admin.addEpisode') : t('show.admin.addEntry')}
      isOpen={isOpen}
      onClose={() => {
        save.reset();
        prefill.reset();
        onClose();
      }}
      onSubmit={() => save.mutate()}
      submitLabel={show ? 'Save' : 'Add'}
      busy={save.isPending}
      error={error && Object.keys(errors).length === 0 ? describeApiError(error) : null}
    >
      {!isEpisode && !show?.type?.includes('episode') && (
        <FormGroup>
          <Label for="show-type">{t('show.admin.type')}</Label>
          <Input id="show-type" type="select" value={type} onChange={(e) => setType(e.target.value)} invalid={Boolean(errors.type)}>
            {otherTypes.map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </Input>
          {err('type')}
        </FormGroup>
      )}
      {isEpisode && (
        <div className="d-flex gap-3">
          <FormGroup className="flex-fill">
            <Label for="show-season">{t('show.admin.season')}</Label>
            <Input
              id="show-season"
              type="number"
              min={0}
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              invalid={Boolean(errors.season)}
            />
            {err('season')}
          </FormGroup>
          <FormGroup className="flex-fill">
            <Label for="show-episode">{t('show.admin.episode')}</Label>
            <Input
              id="show-episode"
              type="number"
              min={1}
              value={episode}
              onChange={(e) => setEpisode(e.target.value)}
              invalid={Boolean(errors.episode)}
            />
            {err('episode')}
          </FormGroup>
        </div>
      )}
      {isEpisode && (
        <FormGroup check className="mb-3">
          <Input id="show-twoparter" type="checkbox" checked={twoparter} onChange={(e) => setTwoparter(e.target.checked)} />
          <Label for="show-twoparter" check>
            {t('show.admin.twoPart')}
          </Label>
        </FormGroup>
      )}
      <FormGroup>
        <Label for="show-no">{t('show.admin.overall')}</Label>
        <Input id="show-no" type="number" min={1} value={no} onChange={(e) => setNo(e.target.value)} invalid={Boolean(errors.no)} />
        {err('no')}
      </FormGroup>
      <FormGroup>
        <Label for="show-title">{t('show.admin.titleField')}</Label>
        <Input id="show-title" maxLength={100} value={title} onChange={(e) => setTitle(e.target.value)} invalid={Boolean(errors.title)} />
        {err('title')}
      </FormGroup>
      <FormGroup>
        <Label for="show-airs">{t('show.admin.airs')}</Label>
        <Input id="show-airs" type="datetime-local" value={airs} onChange={(e) => setAirs(e.target.value)} invalid={Boolean(errors.airs)} />
        {err('airs')}
        <FormText>{t('show.admin.airsHelp')}</FormText>
      </FormGroup>
      <FormGroup>
        <Label for="show-notes">Notes (optional, up to 1000 characters)</Label>
        <Input
          id="show-notes"
          type="textarea"
          rows={3}
          maxLength={1000}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          invalid={Boolean(errors.notes)}
        />
        {err('notes')}
      </FormGroup>
    </FormDialog>
  );
};
