import { useQueryClient } from '@tanstack/react-query';
import Axios from 'axios';
import { useTranslations } from 'next-intl';
import { FC, useState } from 'react';
import { Alert, Button } from 'reactstrap';

import { SlimGuideTag, TagListItem } from '@mlp-vectorclub/api-types';
import { TagFormDialog } from 'src/components/colorguide/TagAdmin';
import { ActionMenu } from 'src/components/shared/ActionMenu';
import InlineIcon from 'src/components/shared/InlineIcon';
import { useDialog } from 'src/components/shared/dialogs/DialogProvider';
import { describeApiError, useAuth, useConfig } from 'src/hooks';
import { TagService } from 'src/services/tags';
import { UnifiedErrorResponse } from 'src/types';
import { ENDPOINTS, httpResponseMapper } from 'src/utils';

/** "New tag" next to "Edit tags", staff only (the old site had it in the right click menu of the tags) */
export const NewTagButton: FC<{ appearanceId: number }> = ({ appearanceId }) => {
  const t = useTranslations();
  const { isStaff } = useAuth();
  const { config } = useConfig();
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  if (!isStaff || !config) return null;
  return (
    <>
      <Button color="darkblue" data-testid="new-tag-btn" onClick={() => setCreating(true)}>
        <InlineIcon icon="plus" first />
        {t('colorGuide.tags.admin.new')}
      </Button>
      <TagFormDialog
        tag={null}
        page={1}
        tagTypes={config.tagTypes}
        isOpen={creating}
        onClose={() => {
          setCreating(false);
          void queryClient.invalidateQueries({ queryKey: [ENDPOINTS.APPEARANCE({ id: appearanceId })] });
        }}
      />
    </>
  );
};

/** A "⋯" menu after a tag of the appearance page for staff: edit or delete the tag itself (as the old site's right click menu on a tag did) */
export const TagMenu: FC<{ tag: SlimGuideTag; appearanceId: number }> = ({ tag, appearanceId }) => {
  const t = useTranslations();
  const { isStaff } = useAuth();
  const { config } = useConfig();
  const { confirm } = useDialog();
  const queryClient = useQueryClient();
  const [details, setDetails] = useState<TagListItem | null>(null);
  const [error, setError] = useState<UnifiedErrorResponse | null>(null);
  if (!isStaff || !config) return null;

  const refresh = () => void queryClient.invalidateQueries({ queryKey: [ENDPOINTS.APPEARANCE({ id: appearanceId })] });
  const load = async () => {
    setError(null);
    try {
      return (await Axios.get<TagListItem>(`/tags/${tag.id}`)).data;
    } catch (e) {
      setError(httpResponseMapper(e));
      return null;
    }
  };

  return (
    <>
      <ActionMenu
        title={t('colorGuide.tags.staffMenu.tagMenu', { name: tag.name })}
        items={[
          {
            key: 'edit',
            label: t('colorGuide.tags.staffMenu.edit'),
            icon: 'pencil-alt',
            onClick: () => void load().then((loaded) => loaded && setDetails(loaded)),
          },
          {
            key: 'delete',
            label: t('colorGuide.tags.staffMenu.delete'),
            icon: 'trash',
            danger: true,
            separated: true,
            onClick: async () => {
              const loaded = await load();
              if (!loaded) return;
              if (
                await confirm({
                  title: t('colorGuide.tags.admin.deleteTitle'),
                  body:
                    loaded.uses > 0
                      ? t('colorGuide.tags.admin.deleteUsed', { name: loaded.name, count: loaded.uses })
                      : t('colorGuide.tags.admin.deleteUnused', { name: loaded.name }),
                  color: 'danger',
                  confirmLabel: t('colorGuide.tags.admin.delete'),
                })
              ) {
                try {
                  await TagService.remove(loaded.id, loaded.uses > 0);
                  refresh();
                } catch (e) {
                  setError(httpResponseMapper(e));
                }
              }
            },
          },
        ]}
      />
      {error && (
        <Alert color="danger" fade={false} className="py-1 my-1" role="alert">
          {describeApiError(error)}
        </Alert>
      )}
      {details && (
        <TagFormDialog
          tag={details}
          page={1}
          tagTypes={config.tagTypes}
          isOpen
          onClose={() => {
            setDetails(null);
            refresh();
          }}
        />
      )}
    </>
  );
};
