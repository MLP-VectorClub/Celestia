import { useTranslations } from 'next-intl';
import { FC, useState } from 'react';
import { Alert, Button, Card, CardBody, Col, Row } from 'reactstrap';

import { ColorGroup } from '@mlp-vectorclub/api-types';
import styles from 'modules/AppearanceColorGroups.module.scss';
import { ColorGroupDialog } from 'src/components/colorguide/ColorGroupDialog';
import { ColorGroupOrderDialog } from 'src/components/colorguide/ColorGroupOrderDialog';
import { ColorListItem } from 'src/components/colorguide/ColorListItem';
import ButtonCollection from 'src/components/shared/ButtonCollection';
import InlineIcon from 'src/components/shared/InlineIcon';
import { useDialog } from 'src/components/shared/dialogs/DialogProvider';
import { describeApiError, useApiMutation, useAuth, usePrefs } from 'src/hooks';
import { ColorGroupService } from 'src/services/color-groups';
import { ENDPOINTS } from 'src/utils';

interface PropTypes {
  colorGroups?: ColorGroup[];
  /** Both are needed to show the editing controls: `canEdit` comes from the appearance */
  appearanceId?: number;
  canEdit?: boolean;
}

type Editing = { kind: 'create' } | { kind: 'edit'; id: number } | { kind: 'order' } | null;

export const AppearanceColorGroups: FC<PropTypes> = ({ colorGroups, appearanceId, canEdit = false }) => {
  const t = useTranslations();
  const { signedIn } = useAuth();
  const prefs = usePrefs(signedIn);
  const { confirm } = useDialog();
  const [editing, setEditing] = useState<Editing>(null);

  const editable = canEdit && appearanceId !== undefined;
  const invalidate = appearanceId === undefined ? [] : [[ENDPOINTS.APPEARANCE({ id: appearanceId })]];
  const remove = useApiMutation((id: number) => ColorGroupService.remove(id), { invalidate });
  const template = useApiMutation(() => ColorGroupService.applyTemplate(appearanceId!), { invalidate });

  const groups = colorGroups ?? [];
  if (groups.length === 0 && !editable) return null;

  const error = remove.error ?? template.error;
  return (
    <>
      <h2>
        <InlineIcon icon="palette" first size="xs" />
        {t('colorGuide.edit.groups.count', { count: groups.length })}
      </h2>
      {editable && (
        <ButtonCollection leftAlign>
          <Button size="sm" color="ui" onClick={() => setEditing({ kind: 'order' })} disabled={groups.length < 2}>
            <InlineIcon icon="sort" first />
            {t('colorGuide.edit.groups.reorder')}
          </Button>
          <Button size="sm" color="success" onClick={() => setEditing({ kind: 'create' })} data-testid="create-colorgroup-btn">
            <InlineIcon icon="plus" first />
            {t('colorGuide.edit.groups.create')}
          </Button>
          <Button
            size="sm"
            color="ui"
            disabled={template.isPending}
            onClick={async () => {
              if (
                await confirm({
                  title: t('colorGuide.edit.groups.template'),
                  body: t('colorGuide.edit.groups.templateBody'),
                  confirmLabel: t('colorGuide.edit.common.apply'),
                })
              )
                template.mutate();
            }}
          >
            <InlineIcon icon="clone" first />
            {t('colorGuide.edit.groups.template')}
          </Button>
        </ButtonCollection>
      )}
      {error && (
        <Alert color="danger" fade={false} role="alert">
          {describeApiError(error)}
        </Alert>
      )}
      <Row className={styles.colorGroupCardRow}>
        {groups.map((cg) => (
          <Col key={cg.id}>
            <Card className={styles.colorGroupCard} role="region" aria-label={`Color Group: ${cg.label}`}>
              <CardBody className="p-2">
                <h3 className="text-center">{cg.label}</h3>
                {editable && (
                  <ButtonCollection>
                    <Button size="sm" color="ui" onClick={() => setEditing({ kind: 'edit', id: cg.id })} data-testid="edit-colorgroup-btn">
                      <InlineIcon icon="pencil-alt" first />
                      {t('colorGuide.edit.common.edit')}
                    </Button>
                    <Button
                      size="sm"
                      color="danger"
                      data-testid="delete-colorgroup-btn"
                      disabled={remove.isPending}
                      onClick={async () => {
                        if (
                          await confirm({
                            title: t('colorGuide.edit.groups.deleteTitle'),
                            body: t('colorGuide.edit.groups.deleteBody', { label: cg.label }),
                            color: 'danger',
                            confirmLabel: t('colorGuide.edit.common.delete'),
                          })
                        ) {
                          remove.mutate(cg.id);
                        }
                      }}
                    >
                      <InlineIcon icon="trash" first />
                      {t('colorGuide.edit.common.delete')}
                    </Button>
                  </ButtonCollection>
                )}
                <ul className="m-0 p-0">
                  {cg.colors.map((c) => (
                    <ColorListItem key={c.id} color={c} hideColorInfo={Boolean(prefs?.cg_hideclrinfo)} />
                  ))}
                </ul>
              </CardBody>
            </Card>
          </Col>
        ))}
      </Row>
      {editable && (
        <>
          <ColorGroupDialog
            key={editing?.kind === 'edit' ? editing.id : 'create'}
            appearanceId={appearanceId}
            groupId={editing?.kind === 'edit' ? editing.id : undefined}
            isOpen={editing?.kind === 'create' || editing?.kind === 'edit'}
            onClose={() => setEditing(null)}
          />
          <ColorGroupOrderDialog appearanceId={appearanceId} isOpen={editing?.kind === 'order'} onClose={() => setEditing(null)} />
        </>
      )}
    </>
  );
};
