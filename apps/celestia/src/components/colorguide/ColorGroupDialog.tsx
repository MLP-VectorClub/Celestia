import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { FC, useEffect, useMemo, useState } from 'react';
import { Button, FormGroup, FormText, Input, InputGroup, Label } from 'reactstrap';

import { ColorTextEditor } from 'src/components/colorguide/ColorTextEditor';
import InlineIcon from 'src/components/shared/InlineIcon';
import { FormDialog } from 'src/components/shared/dialogs/FormDialog';
import { describeApiError, fieldErrors, useApiMutation, useConfig } from 'src/hooks';
import { ColorGroupService } from 'src/services/color-groups';
import { ENDPOINTS } from 'src/utils';
import { ColorTextParseError, ColorTextRow, colorsToText, parseColorsText } from 'src/utils/color-group-text';

type ColorRow = ColorTextRow;

interface PropTypes {
  appearanceId: number;
  /** Edits this group, creates a new one when missing */
  groupId?: number;
  isOpen: boolean;
  onClose: () => void;
}

const emptyRow = (): ColorRow => ({ label: '', hex: '' });

export const ColorGroupDialog: FC<PropTypes> = ({ appearanceId, groupId, isOpen, onClose }) => {
  const t = useTranslations();
  const { patterns } = useConfig();
  const [label, setLabel] = useState('');
  const [rows, setRows] = useState<ColorRow[]>([emptyRow()]);
  const [major, setMajor] = useState(false);
  const [reason, setReason] = useState('');
  // The old site's plain text editor: the same colors as one line each, null while the interactive editor is shown
  const [text, setText] = useState<string | null>(null);
  const [parseError, setParseError] = useState<ColorTextParseError | null>(null);

  const existing = useQuery({
    queryKey: ['color-group', groupId],
    queryFn: () => ColorGroupService.get(groupId!).then((r) => r.data),
    enabled: isOpen && groupId !== undefined,
    staleTime: 0,
    gcTime: 0,
  });

  useEffect(() => {
    if (!existing.data) return;
    setLabel(existing.data.label ?? '');
    setRows((existing.data.colors ?? []).map((c) => ({ id: c.id, label: c.label ?? '', hex: c.hex ?? '' })));
  }, [existing.data]);

  /** The colors as they are now, read from the text when that is being edited */
  const readRows = (): ColorRow[] | null => {
    if (text === null) return rows;
    try {
      setParseError(null);
      return parseColorsText(text);
    } catch (e) {
      if (!(e instanceof ColorTextParseError)) throw e;
      setParseError(e);
      return null;
    }
  };
  const toggleEditor = () => {
    if (text === null) {
      setText(colorsToText(rows));
      return;
    }
    const parsed = readRows();
    if (!parsed) return;
    setRows(parsed.length > 0 ? parsed : [emptyRow()]);
    setText(null);
  };

  const hexError = (hex: string) => hex !== '' && patterns && !patterns.hexColor.test(hex);
  const anyInvalidHex = useMemo(() => (text === null ? rows : []).some((r) => hexError(r.hex)), [rows, text, patterns]); // eslint-disable-line react-hooks/exhaustive-deps

  const body = (list: ColorRow[]) => ({
    label: label.trim(),
    colors: list
      .filter((r) => r.label.trim() !== '')
      .map((r) => ({ ...(r.id ? { id: r.id } : {}), label: r.label.trim(), hex: r.hex.trim() === '' ? null : r.hex.trim() })),
    major: Number(major) as unknown as boolean,
    reason: major ? reason.trim() : undefined,
  });

  const save = useApiMutation(
    (list: ColorRow[]) =>
      groupId === undefined ? ColorGroupService.create(appearanceId, body(list)) : ColorGroupService.update(groupId, body(list)),
    {
      invalidate: [[ENDPOINTS.APPEARANCE({ id: appearanceId })]],
      onSuccess: () => {
        setMajor(false);
        setReason('');
        setText(null);
        onClose();
      },
    }
  );

  const update = (index: number, patch: Partial<ColorRow>) =>
    setRows((current) => current.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  const move = (index: number, by: -1 | 1) =>
    setRows((current) => {
      const next = [...current];
      const target = index + by;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const errors = fieldErrors(save.error);
  const handled = Object.keys(errors).length > 0;
  const error = save.error ?? existing.error;

  return (
    <FormDialog
      title={groupId === undefined ? t('colorGuide.edit.colorGroup.createTitle') : t('colorGuide.edit.colorGroup.editTitle')}
      isOpen={isOpen}
      onClose={() => {
        save.reset();
        setText(null);
        setParseError(null);
        onClose();
      }}
      onSubmit={() => {
        const list = readRows();
        if (!list || list.some((r) => hexError(r.hex))) return;
        save.mutate(list);
      }}
      submitLabel={t('colorGuide.edit.common.save')}
      busy={save.isPending || existing.isFetching}
      error={error && !handled ? describeApiError(error as never) : error && handled ? Object.values(errors)[0] : null}
    >
      <FormGroup>
        <Label for={`cg-label-${groupId ?? 'new'}`}>{t('colorGuide.edit.colorGroup.groupName')}</Label>
        <Input
          id={`cg-label-${groupId ?? 'new'}`}
          data-testid="form-label-input"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          maxLength={30}
          required
          autoFocus
          disabled={existing.isFetching}
        />
      </FormGroup>
      <div className="d-flex align-items-center justify-content-between">
        <Label className="mb-1">{t('colorGuide.edit.colorGroup.colors')}</Label>
        <Button
          type="button"
          size="sm"
          color="darkblue"
          className="mb-1"
          id="color-editor-toggle"
          onClick={toggleEditor}
          disabled={existing.isFetching}
        >
          <InlineIcon icon={text === null ? 'file-alt' : 'pencil-alt'} first />
          {text === null ? t('colorGuide.edit.colorGroup.plainText') : t('colorGuide.edit.colorGroup.interactive')}
        </Button>
      </div>
      {text !== null ? (
        <>
          <ColorTextEditor
            label={t('colorGuide.edit.colorGroup.plainText')}
            rows={Math.min(16, Math.max(6, text.split('\n').length))}
            value={text}
            onChange={setText}
            invalid={Boolean(parseError)}
          />
          <FormText>{t('colorGuide.edit.colorGroup.textHelp')}</FormText>
          {parseError && (
            <FormText color="danger" tag="div" className="mt-1">
              {t('colorGuide.edit.colorGroup.parseError', { line: parseError.lineNumber })}
              <pre className="mb-1">
                <code>{parseError.line}</code>
              </pre>
              {parseError.missing.length > 0
                ? t('colorGuide.edit.colorGroup.parseMissing', {
                    what: parseError.missing
                      .map((m) =>
                        m === 'hex' ? t('colorGuide.edit.colorGroup.missing_hex') : t('colorGuide.edit.colorGroup.missing_name')
                      )
                      .join(' / '),
                  })
                : t('colorGuide.edit.colorGroup.parseTypos')}
            </FormText>
          )}
        </>
      ) : (
        <>
          {rows.map((row, i) => (
            <InputGroup key={row.id ?? `new-${i}`} className="mb-1">
              <Input
                aria-label={t('colorGuide.edit.colorGroup.colorName', { n: i + 1 })}
                data-testid="form-color-label"
                placeholder={t('colorGuide.edit.colorGroup.name')}
                value={row.label}
                onChange={(e) => update(i, { label: e.target.value })}
                maxLength={30}
                disabled={existing.isFetching}
              />
              <Input
                aria-label={t('colorGuide.edit.colorGroup.colorValue', { n: i + 1 })}
                data-testid="form-color-hex"
                placeholder={t('colorGuide.edit.colorGroup.hex')}
                value={row.hex}
                onChange={(e) => update(i, { hex: e.target.value })}
                invalid={Boolean(hexError(row.hex))}
                disabled={existing.isFetching}
                style={{ maxWidth: '9rem' }}
              />
              <Button
                type="button"
                outline
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label={t('colorGuide.edit.colorGroup.moveUp')}
              >
                <InlineIcon icon="arrow-up" />
              </Button>
              <Button
                type="button"
                outline
                onClick={() => move(i, 1)}
                disabled={i === rows.length - 1}
                aria-label={t('colorGuide.edit.colorGroup.moveDown')}
              >
                <InlineIcon icon="arrow-down" />
              </Button>
              <Button
                type="button"
                outline
                color="danger"
                onClick={() => setRows((c) => c.filter((_, idx) => idx !== i))}
                aria-label={t('colorGuide.edit.colorGroup.removeColor')}
              >
                <InlineIcon icon="times" />
              </Button>
            </InputGroup>
          ))}
          <Button type="button" size="sm" color="link" onClick={() => setRows((c) => [...c, emptyRow()])}>
            <InlineIcon icon="plus" first />
            {t('colorGuide.edit.colorGroup.addColor')}
          </Button>
        </>
      )}
      {anyInvalidHex && <FormText color="danger">{t('colorGuide.edit.colorGroup.hexInvalid')}</FormText>}
      <FormGroup check className="mt-3">
        <Input id={`cg-major-${groupId ?? 'new'}`} type="checkbox" checked={major} onChange={(e) => setMajor(e.target.checked)} />
        <Label for={`cg-major-${groupId ?? 'new'}`} check>
          {t('colorGuide.edit.colorGroup.major')}
        </Label>
      </FormGroup>
      {major && (
        <FormGroup className="mt-2">
          <Label for={`cg-reason-${groupId ?? 'new'}`}>{t('colorGuide.edit.colorGroup.reason')}</Label>
          <Input id={`cg-reason-${groupId ?? 'new'}`} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={255} required />
        </FormGroup>
      )}
    </FormDialog>
  );
};
