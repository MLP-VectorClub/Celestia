import { useTranslations } from 'next-intl';
import { FC, useEffect, useState } from 'react';
import { Alert, Button, FormGroup, FormText, Input, Label } from 'reactstrap';

import { GetConfigResult, TagListItem } from '@mlp-vectorclub/api-types';
import InlineIcon from 'src/components/shared/InlineIcon';
import { useDialog } from 'src/components/shared/dialogs/DialogProvider';
import { FormDialog } from 'src/components/shared/dialogs/FormDialog';
import { describeApiError, fieldErrors, useApiMutation } from 'src/hooks';
import { TagService } from 'src/services/tags';
import { ENDPOINTS } from 'src/utils';

interface BaseProps {
  page: number;
  tagTypes: GetConfigResult['tagTypes'];
}

type Invalidate = [[string]];
const tagsKey = (page: number): Invalidate => [[ENDPOINTS.TAGS({ page })]];

interface FormProps extends BaseProps {
  /** `null` creates a tag */
  tag: TagListItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TagFormDialog: FC<FormProps> = ({ tag, page, tagTypes, isOpen, onClose }) => {
  const t = useTranslations();
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [title, setTitle] = useState('');
  useEffect(() => {
    if (isOpen) {
      setName(tag?.name ?? '');
      setType(tag?.type ?? '');
      setTitle(tag?.title ?? '');
    }
  }, [isOpen, tag]);

  const save = useApiMutation(
    () => {
      const body = { name: name.trim(), ...(type ? { type } : {}), title: title.trim() || null };
      return tag ? TagService.update(tag.id, body) : TagService.create(body);
    },
    { invalidate: tagsKey(page), onSuccess: onClose }
  );
  const errors = fieldErrors(save.error);

  return (
    <FormDialog
      title={tag ? t('colorGuide.tags.admin.editTitle', { name: tag.name }) : t('colorGuide.tags.admin.new')}
      isOpen={isOpen}
      onClose={() => {
        save.reset();
        onClose();
      }}
      onSubmit={() => save.mutate()}
      submitLabel={tag ? t('colorGuide.tags.admin.save') : t('colorGuide.tags.admin.create')}
      busy={save.isPending}
      error={save.error && Object.keys(errors).length === 0 ? describeApiError(save.error) : null}
    >
      <FormGroup>
        <Label for="tag-name">{t('colorGuide.tags.admin.name')}</Label>
        <Input id="tag-name" value={name} onChange={(e) => setName(e.target.value)} invalid={Boolean(errors.name)} />
        {errors.name && <div className="invalid-feedback d-block">{errors.name}</div>}
      </FormGroup>
      <FormGroup>
        <Label for="tag-type">{t('colorGuide.tags.admin.type')}</Label>
        <Input id="tag-type" type="select" value={type} onChange={(e) => setType(e.target.value)} invalid={Boolean(errors.type)}>
          <option value="">{t('colorGuide.tags.admin.noType')}</option>
          {Object.entries(tagTypes).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </Input>
        {errors.type && <div className="invalid-feedback d-block">{errors.type}</div>}
      </FormGroup>
      <FormGroup>
        <Label for="tag-title">Title (optional, up to 255 characters)</Label>
        <Input id="tag-title" maxLength={255} value={title} onChange={(e) => setTitle(e.target.value)} invalid={Boolean(errors.title)} />
        {errors.title && <div className="invalid-feedback d-block">{errors.title}</div>}
      </FormGroup>
    </FormDialog>
  );
};

/** “New tag” button of the tag list, shown to staff */
export const NewTagButton: FC<BaseProps> = (props) => {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button color="ui" size="sm" onClick={() => setOpen(true)}>
        <InlineIcon icon="plus" first />
        {t('colorGuide.tags.admin.new')}
      </Button>
      <TagFormDialog {...props} tag={null} isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
};

const SynonymDialog: FC<BaseProps & { tag: TagListItem; isOpen: boolean; onClose: () => void }> = ({ tag, page, isOpen, onClose }) => {
  const t = useTranslations();
  const [target, setTarget] = useState('');
  const save = useApiMutation(() => TagService.makeSynonym(tag.id, Number(target)), {
    invalidate: tagsKey(page),
    onSuccess: () => {
      setTarget('');
      onClose();
    },
  });
  const targetId = Number(target);

  return (
    <FormDialog
      title={t('colorGuide.tags.admin.synonymTitle', { name: tag.name })}
      isOpen={isOpen}
      onClose={() => {
        save.reset();
        onClose();
      }}
      onSubmit={() => Number.isInteger(targetId) && targetId > 0 && save.mutate()}
      submitLabel={t('colorGuide.tags.admin.makeSynonym')}
      submitTestId="dialog-btn-make-synonym"
      busy={save.isPending}
      error={save.error ? describeApiError(save.error) : null}
    >
      <FormGroup>
        <Label for="synonym-target">{t('colorGuide.tags.admin.mergeInto')}</Label>
        <Input id="synonym-target" type="number" min={1} value={target} onChange={(e) => setTarget(e.target.value)} />
        <FormText>{t('colorGuide.tags.admin.mergeHelp')}</FormText>
      </FormGroup>
    </FormDialog>
  );
};

/** Per-tag management buttons: edit, delete, synonym handling, recount */
export const TagAdminActions: FC<BaseProps & { tag: TagListItem }> = ({ tag, page, tagTypes }) => {
  const t = useTranslations();
  const { confirm } = useDialog();
  const [dialog, setDialog] = useState<'edit' | 'synonym' | null>(null);

  const remove = useApiMutation((confirmed: boolean) => TagService.remove(tag.id, confirmed), { invalidate: tagsKey(page) });
  const unsynonym = useApiMutation((keepTagged: boolean) => TagService.removeSynonym(tag.id, keepTagged), { invalidate: tagsKey(page) });
  const recount = useApiMutation(() => TagService.recountUses([tag.id]), { invalidate: tagsKey(page) });

  const error = remove.error ?? unsynonym.error ?? recount.error;
  const busy = remove.isPending || unsynonym.isPending || recount.isPending;

  return (
    <span className="ms-2 d-inline-flex flex-wrap gap-1 align-middle">
      <small className="text-muted align-self-center">#{tag.id}</small>
      <Button size="sm" color="ui" disabled={busy} onClick={() => setDialog('edit')}>
        {t('colorGuide.tags.admin.edit')}
      </Button>
      {tag.synonymOf ? (
        <Button
          size="sm"
          color="ui"
          disabled={busy}
          onClick={async () => {
            if (
              await confirm({
                title: t('colorGuide.tags.admin.unlink'),
                body: t('colorGuide.tags.admin.unlinkBody', { name: tag.name, target: tag.synonymOf?.name ?? '' }),
                confirmLabel: t('colorGuide.tags.admin.unlinkConfirm'),
              })
            ) {
              unsynonym.mutate(true);
            }
          }}
        >
          {t('colorGuide.tags.admin.unlink')}
        </Button>
      ) : (
        <>
          <Button size="sm" color="ui" disabled={busy} onClick={() => setDialog('synonym')}>
            {t('colorGuide.tags.admin.makeSynonym')}
          </Button>
          <Button size="sm" color="ui" disabled={busy} onClick={() => recount.mutate()}>
            {t('colorGuide.tags.admin.recount')}
          </Button>
        </>
      )}
      <Button
        size="sm"
        color="danger"
        outline
        disabled={busy}
        onClick={async () => {
          if (
            await confirm({
              title: t('colorGuide.tags.admin.deleteTitle'),
              body:
                tag.uses > 0
                  ? t('colorGuide.tags.admin.deleteUsed', { name: tag.name, count: tag.uses })
                  : t('colorGuide.tags.admin.deleteUnused', { name: tag.name }),
              color: 'danger',
              confirmLabel: t('colorGuide.tags.admin.delete'),
            })
          ) {
            remove.mutate(tag.uses > 0);
          }
        }}
      >
        {t('colorGuide.tags.admin.delete')}
      </Button>
      {error && (
        <Alert color="danger" fade={false} className="w-100 mb-0 py-1" role="alert">
          {describeApiError(error)}
        </Alert>
      )}
      <TagFormDialog tag={tag} page={page} tagTypes={tagTypes} isOpen={dialog === 'edit'} onClose={() => setDialog(null)} />
      <SynonymDialog tag={tag} page={page} tagTypes={tagTypes} isOpen={dialog === 'synonym'} onClose={() => setDialog(null)} />
    </span>
  );
};
