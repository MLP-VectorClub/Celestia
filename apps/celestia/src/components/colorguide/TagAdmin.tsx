import { useTranslations } from 'next-intl';
import { FC, useEffect, useState } from 'react';
import { Alert, Button, FormGroup, FormText, Input, Label } from 'reactstrap';

import { GetConfigResult, TagListItem } from '@mlp-vectorclub/api-types';
import { TagSuggestions } from 'src/components/colorguide/TagSuggestions';
import { IconButton } from 'src/components/shared/IconButton';
import InlineIcon from 'src/components/shared/InlineIcon';
import { useDialog } from 'src/components/shared/dialogs/DialogProvider';
import { FormDialog } from 'src/components/shared/dialogs/FormDialog';
import { describeApiError, fieldErrors, useApiMutation, useTagSuggestions } from 'src/hooks';
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
  // The target is found by typing its name (and picked from the list) or entered as its ID
  const [target, setTarget] = useState('');
  const [picked, setPicked] = useState<{ id: number; name: string } | null>(null);
  const typedId = /^\d+$/.test(target.trim()) ? Number(target.trim()) : NaN;
  const targetId = picked?.id ?? typedId;
  const suggestions = useTagSuggestions(picked || Number.isInteger(typedId) ? '' : target, { not: tag.id, enabled: isOpen });
  const save = useApiMutation(() => TagService.makeSynonym(tag.id, targetId), {
    invalidate: tagsKey(page),
    onSuccess: () => {
      setTarget('');
      setPicked(null);
      onClose();
    },
  });

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
        <Input
          id="synonym-target"
          autoComplete="off"
          value={target}
          onChange={(e) => {
            setTarget(e.target.value);
            setPicked(null);
          }}
        />
        <TagSuggestions
          suggestions={suggestions}
          active={null}
          onPick={(found) => {
            setPicked({ id: found.id, name: found.name });
            setTarget(found.name);
          }}
        />
        <FormText>{picked ? t('colorGuide.tags.admin.mergePicked', { id: picked.id }) : t('colorGuide.tags.admin.mergeHelp')}</FormText>
      </FormGroup>
    </FormDialog>
  );
};

/** Per-tag management buttons: edit, delete, synonym handling, recount */
/** The icon buttons next to a tag's name: edit, delete and make (or unlink) synonym; every one of them as a visible button, none behind a right click */
export const TagRowActions: FC<BaseProps & { tag: TagListItem }> = ({ tag, page, tagTypes }) => {
  const t = useTranslations();
  const { confirm } = useDialog();
  const [dialog, setDialog] = useState<'edit' | 'synonym' | null>(null);

  const remove = useApiMutation((confirmed: boolean) => TagService.remove(tag.id, confirmed), { invalidate: tagsKey(page) });
  const unsynonym = useApiMutation((keepTagged: boolean) => TagService.removeSynonym(tag.id, keepTagged), { invalidate: tagsKey(page) });
  const error = remove.error ?? unsynonym.error;
  const busy = remove.isPending || unsynonym.isPending;

  return (
    <span className="utils d-inline-flex align-items-center">
      <IconButton
        icon="pencil-alt"
        color="blue"
        title={t('colorGuide.tags.admin.edit')}
        className="edit"
        disabled={busy}
        onClick={() => setDialog('edit')}
      />
      <IconButton
        icon="trash"
        color="red"
        title={t('colorGuide.tags.admin.delete')}
        className="delete"
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
      />
      {tag.synonymOf ? (
        <IconButton
          icon="unlink"
          color="orange"
          title={t('colorGuide.tags.admin.unlink')}
          className="unsynon"
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
        />
      ) : (
        <IconButton
          icon="sitemap"
          color="darkblue"
          title={t('colorGuide.tags.admin.makeSynonym')}
          className="synon"
          disabled={busy}
          onClick={() => setDialog('synonym')}
        />
      )}
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

/** The number of uses of a tag with the button that counts it again (synonyms have no count of their own) */
export const TagUses: FC<{ tag: TagListItem; page: number; canRecount: boolean }> = ({ tag, page, canRecount }) => {
  const t = useTranslations();
  const recount = useApiMutation(() => TagService.recountUses([tag.id]), { invalidate: tagsKey(page) });
  if (tag.synonymOf) return <span>-</span>;
  return (
    <>
      <span>{tag.uses}</span>
      {canRecount && (
        <IconButton
          icon="sync"
          color="darkblue"
          title={t('colorGuide.tags.admin.recount')}
          className="refresh"
          disabled={recount.isPending}
          onClick={() => recount.mutate()}
        />
      )}
    </>
  );
};

/** In the header of the uses column: count the uses of every tag on the page again */
export const RefreshAllButton: FC<{ ids: number[]; page: number }> = ({ ids, page }) => {
  const t = useTranslations();
  const refresh = useApiMutation(() => TagService.recountUses(ids), { invalidate: tagsKey(page) });
  return (
    <IconButton
      icon="sync"
      color="darkblue"
      title={t('colorGuide.tags.admin.refreshAll')}
      className="refresh-all"
      disabled={refresh.isPending || ids.length === 0}
      onClick={() => refresh.mutate()}
    />
  );
};
