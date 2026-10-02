import { useTranslations } from 'next-intl';
import { FC, useEffect, useState } from 'react';
import { Alert, Button, Card, CardBody, FormGroup, Input, Label } from 'reactstrap';

import { FormDialog } from 'src/components/shared/dialogs/FormDialog';
import { describeApiError, fieldErrors, useApiMutation } from 'src/hooks';
import { AppearanceEditService } from 'src/services/appearance-edit';
import { ENDPOINTS } from 'src/utils';

const MAX_CUTIE_MARKS = 2;

type Attribution = 'deviation' | 'user' | 'none';

interface Row {
  key: number;
  id?: number;
  label: string;
  facing: '' | 'left' | 'right';
  rotation: number;
  attribution: Attribution;
  deviation: string;
  username: string;
  /** Sanitized markup of a newly uploaded file; existing marks keep their file when this is left out */
  svgdata?: string;
  fileName?: string;
  warnings: string[];
}

interface PropTypes {
  appearanceId: number;
  isOpen: boolean;
  onClose: () => void;
}

let rowKey = 0;
const blankRow = (): Row => ({
  key: ++rowKey,
  label: '',
  facing: '',
  rotation: 0,
  attribution: 'none',
  deviation: '',
  username: '',
  warnings: [],
});

/** Replaces all cutie marks of an appearance (up to two) in one request, as the API does */
export const CutieMarkDialog: FC<PropTypes> = ({ appearanceId, isOpen, onClose }) => {
  const t = useTranslations();
  const [rows, setRows] = useState<Row[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useApiMutation(() => AppearanceEditService.getCutieMarks(appearanceId), {
    onSuccess: (data) => {
      setRows(
        (data.cms ?? []).map((cm) => ({
          key: ++rowKey,
          id: cm.id,
          label: cm.label ?? '',
          facing: cm.facing === 'left' || cm.facing === 'right' ? cm.facing : '',
          rotation: cm.rotation ?? 0,
          attribution: cm.deviation ? 'deviation' : cm.username ? 'user' : 'none',
          deviation: cm.deviation ?? '',
          username: cm.username ?? '',
          warnings: [],
        }))
      );
      setLoaded(true);
    },
  });
  useEffect(() => {
    if (isOpen && !loaded && !load.isPending) load.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, loaded]);

  const update = (key: number, patch: Partial<Row>) => setRows((all) => all.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const sanitize = useApiMutation(({ file }: { key: number; file: File }) => AppearanceEditService.sanitizeSvg(appearanceId, file), {
    onSuccess: (data, { key, file }) => update(key, { svgdata: data.svgdata, fileName: file.name, warnings: data.warnings ?? [] }),
  });

  const save = useApiMutation(
    () =>
      AppearanceEditService.setCutieMarks(
        appearanceId,
        rows.map((r) => ({
          ...(r.id ? { id: r.id } : {}),
          ...(r.svgdata ? { svgdata: r.svgdata } : {}),
          label: r.label.trim() || null,
          facing: r.facing || null,
          rotation: r.rotation,
          attribution: r.attribution,
          ...(r.attribution === 'deviation' ? { deviation: r.deviation } : {}),
          ...(r.attribution === 'user' ? { username: r.username } : {}),
        }))
      ),
    {
      invalidate: [[ENDPOINTS.APPEARANCE({ id: appearanceId })]],
      onSuccess: () => {
        setLoaded(false);
        onClose();
      },
    }
  );

  const errors = Object.values(fieldErrors(save.error));
  const error = save.error ?? load.error ?? sanitize.error;
  const missingFile = rows.some((r) => !r.id && !r.svgdata);

  return (
    <FormDialog
      title={t('colorGuide.edit.cutieMarks.title')}
      isOpen={isOpen}
      onClose={() => {
        save.reset();
        sanitize.reset();
        setLoaded(false);
        onClose();
      }}
      onSubmit={() => !missingFile && save.mutate()}
      submitLabel={t('colorGuide.edit.cutieMarks.save')}
      busy={save.isPending || load.isPending || sanitize.isPending}
      error={error ? [describeApiError(error), ...errors.filter((e) => e !== describeApiError(error))].join(' ') : null}
    >
      {rows.map((row, index) => {
        const id = `cm-${appearanceId}-${row.key}`;
        return (
          <Card key={row.key} className="mb-3">
            <CardBody>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <strong>{t('colorGuide.edit.cutieMarks.n', { n: index + 1 })}</strong>
                <Button
                  type="button"
                  size="sm"
                  color="danger"
                  outline
                  onClick={() => setRows((all) => all.filter((r) => r.key !== row.key))}
                >
                  {t('colorGuide.edit.cutieMarks.remove')}
                </Button>
              </div>
              <FormGroup>
                <Label for={`${id}-file`}>
                  {row.id ? t('colorGuide.edit.cutieMarks.replaceFile') : t('colorGuide.edit.cutieMarks.file')}
                </Label>
                <Input
                  id={`${id}-file`}
                  type="file"
                  accept="image/svg+xml,.svg"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) sanitize.mutate({ key: row.key, file });
                  }}
                />
                {row.fileName && <small className="text-muted">{t('colorGuide.edit.cutieMarks.ready', { name: row.fileName })}</small>}
                {!row.id && !row.svgdata && <small className="text-danger d-block">{t('colorGuide.edit.cutieMarks.fileRequired')}</small>}
                {row.warnings.length > 0 && (
                  <Alert color="warning" fade={false} className="mt-2 mb-0">
                    {row.warnings.map((w) => (
                      <div key={w}>{w}</div>
                    ))}
                  </Alert>
                )}
              </FormGroup>
              <FormGroup>
                <Label for={`${id}-label`}>{t('colorGuide.edit.cutieMarks.label')}</Label>
                <Input id={`${id}-label`} maxLength={32} value={row.label} onChange={(e) => update(row.key, { label: e.target.value })} />
              </FormGroup>
              <div className="d-flex gap-3">
                <FormGroup className="flex-fill">
                  <Label for={`${id}-facing`}>{t('colorGuide.edit.cutieMarks.facing')}</Label>
                  <Input
                    id={`${id}-facing`}
                    type="select"
                    value={row.facing}
                    onChange={(e) => update(row.key, { facing: e.target.value as Row['facing'] })}
                  >
                    <option value="">{t('colorGuide.edit.cutieMarks.symmetrical')}</option>
                    <option value="left">{t('colorGuide.edit.cutieMarks.left')}</option>
                    <option value="right">{t('colorGuide.edit.cutieMarks.right')}</option>
                  </Input>
                </FormGroup>
                <FormGroup className="flex-fill">
                  <Label for={`${id}-rotation`}>{t('colorGuide.edit.cutieMarks.rotation')}</Label>
                  <Input
                    id={`${id}-rotation`}
                    type="number"
                    min={-45}
                    max={45}
                    value={row.rotation}
                    onChange={(e) => update(row.key, { rotation: Math.max(-45, Math.min(45, Number(e.target.value) || 0)) })}
                  />
                </FormGroup>
              </div>
              <FormGroup>
                <Label for={`${id}-attribution`}>{t('colorGuide.edit.cutieMarks.attribution')}</Label>
                <Input
                  id={`${id}-attribution`}
                  type="select"
                  value={row.attribution}
                  onChange={(e) => update(row.key, { attribution: e.target.value as Attribution })}
                >
                  <option value="none">{t('colorGuide.edit.cutieMarks.none')}</option>
                  <option value="deviation">{t('colorGuide.edit.cutieMarks.deviation')}</option>
                  <option value="user">{t('colorGuide.edit.cutieMarks.user')}</option>
                </Input>
              </FormGroup>
              {row.attribution === 'deviation' && (
                <FormGroup>
                  <Label for={`${id}-deviation`}>{t('colorGuide.edit.cutieMarks.deviationUrl')}</Label>
                  <Input
                    id={`${id}-deviation`}
                    type="url"
                    value={row.deviation}
                    onChange={(e) => update(row.key, { deviation: e.target.value })}
                  />
                </FormGroup>
              )}
              {row.attribution === 'user' && (
                <FormGroup>
                  <Label for={`${id}-username`}>{t('colorGuide.edit.cutieMarks.username')}</Label>
                  <Input id={`${id}-username`} value={row.username} onChange={(e) => update(row.key, { username: e.target.value })} />
                </FormGroup>
              )}
            </CardBody>
          </Card>
        );
      })}
      <Button
        type="button"
        color="ui"
        size="sm"
        disabled={rows.length >= MAX_CUTIE_MARKS || !loaded}
        onClick={() => setRows((all) => [...all, blankRow()])}
      >
        {t('colorGuide.edit.cutieMarks.add')}
      </Button>
      {loaded && rows.length === 0 && <p className="text-muted mt-2 mb-0">{t('colorGuide.edit.cutieMarks.empty')}</p>}
    </FormDialog>
  );
};
