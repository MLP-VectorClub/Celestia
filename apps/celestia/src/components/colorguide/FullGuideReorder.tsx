import { useTranslations } from 'next-intl';
import { FC, useMemo, useState } from 'react';
import { Alert, Button, Card, CardBody } from 'reactstrap';

import { GetAppearancesFullResult, GuideName } from '@mlp-vectorclub/api-types';
import InlineIcon from 'src/components/shared/InlineIcon';
import { describeApiError, useApiMutation } from 'src/hooks';
import { AppearanceEditService } from 'src/services/appearance-edit';
import { ENDPOINTS } from 'src/utils';

interface PropTypes extends GetAppearancesFullResult {
  guide: GuideName;
  onDone: () => void;
}

interface Section {
  name: string | null;
  ids: number[];
}

const move = (ids: number[], from: number, to: number) => {
  if (to < 0 || to >= ids.length || from === to) return ids;
  const next = [...ids];
  next.splice(to, 0, next.splice(from, 1)[0]);
  return next;
};

/**
 * Staff view of the relevance-ordered full list where entries can be dragged (or moved with the buttons) within their tag group.
 * The order is saved as one list of all IDs in display order
 */
export const FullGuideReorder: FC<PropTypes> = ({ guide, appearances, groups, onDone }) => {
  const t = useTranslations();
  const labels = useMemo(() => new Map(appearances.map((a) => [a.id, a.label])), [appearances]);
  const [sections, setSections] = useState<Section[]>(() =>
    groups.length > 0
      ? groups.map((g) => ({ name: g.name, ids: [...g.appearanceIds] }))
      : [{ name: null, ids: appearances.map((a) => a.id) }]
  );
  const [dragging, setDragging] = useState<{ section: number; index: number } | null>(null);

  const save = useApiMutation(
    () =>
      AppearanceEditService.reorderGuide(
        guide,
        sections.flatMap((s) => s.ids)
      ),
    {
      invalidate: [[ENDPOINTS.APPEARANCES_FULL({ guide, sort: 'relevance' })]],
      onSuccess: onDone,
    }
  );

  const reposition = (section: number, from: number, to: number) =>
    setSections((all) => all.map((s, i) => (i === section ? { ...s, ids: move(s.ids, from, to) } : s)));

  return (
    <>
      <Alert color="info" fade={false}>
        Drag entries, or use the arrows, to change their order within a group. Entries cannot be moved to another group because groups come
        from their tags.
      </Alert>
      {save.error && (
        <Alert color="danger" fade={false} role="alert">
          {describeApiError(save.error)}
        </Alert>
      )}
      <div className="mb-3 d-flex gap-2">
        <Button color="primary" size="sm" disabled={save.isPending} onClick={() => save.mutate()}>
          <InlineIcon icon="check" first />
          {t('colorGuide.edit.reorder.save')}
        </Button>
        <Button color="ui" size="sm" disabled={save.isPending} onClick={onDone}>
          {t('colorGuide.edit.common.cancel')}
        </Button>
      </div>
      {sections.map((section, s) => (
        <section key={section.name ?? 'all'}>
          {section.name && <h2>{section.name}</h2>}
          <ol className="list-unstyled d-flex flex-wrap gap-2">
            {section.ids.map((id, i) => (
              <li
                key={id}
                draggable
                onDragStart={() => setDragging({ section: s, index: i })}
                onDragEnd={() => setDragging(null)}
                onDragOver={(e) => dragging?.section === s && e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragging?.section === s) reposition(s, dragging.index, i);
                  setDragging(null);
                }}
              >
                <Card>
                  <CardBody className="p-2 d-flex align-items-center gap-2">
                    <Button
                      size="sm"
                      color="ui"
                      aria-label={t('colorGuide.edit.reorder.earlier', { label: labels.get(id) ?? '' })}
                      disabled={i === 0}
                      onClick={() => reposition(s, i, i - 1)}
                    >
                      <InlineIcon icon="chevron-left" />
                    </Button>
                    <span style={{ cursor: 'grab' }}>{labels.get(id)}</span>
                    <Button
                      size="sm"
                      color="ui"
                      aria-label={t('colorGuide.edit.reorder.later', { label: labels.get(id) ?? '' })}
                      disabled={i === section.ids.length - 1}
                      onClick={() => reposition(s, i, i + 1)}
                    >
                      <InlineIcon icon="chevron-right" />
                    </Button>
                  </CardBody>
                </Card>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </>
  );
};
