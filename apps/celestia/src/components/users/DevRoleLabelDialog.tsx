import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { FC, useEffect, useState } from 'react';
import { FormGroup, FormText, Input, Label } from 'reactstrap';

import { FormDialog } from 'src/components/shared/dialogs/FormDialog';
import { describeApiError, useApiMutation, useConfig } from 'src/hooks';
import { AdminService } from 'src/services/admin';

/** Developers choose which role label the site shows for the developer role (the small edit button next to a developer's role) */
export const DevRoleLabelDialog: FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const t = useTranslations();
  const { config } = useConfig();
  const queryClient = useQueryClient();
  const stored = useQuery({
    queryKey: ['/settings/dev_role_label'],
    queryFn: () => AdminService.getSetting('dev_role_label').then((r) => r.data.value),
    enabled: isOpen,
  });
  const [value, setValue] = useState('developer');
  useEffect(() => {
    if (isOpen && stored.data) setValue(stored.data);
  }, [isOpen, stored.data]);
  const save = useApiMutation(() => AdminService.setSetting('dev_role_label', value), {
    invalidate: [['/settings/dev_role_label']],
    onSuccess: () => {
      void queryClient.invalidateQueries();
      onClose();
    },
  });

  return (
    <FormDialog
      title={t('users.profile.devRoleTitle')}
      isOpen={isOpen}
      onClose={() => {
        save.reset();
        onClose();
      }}
      onSubmit={() => save.mutate()}
      submitLabel={t('users.profile.save')}
      busy={save.isPending}
      error={save.error ? describeApiError(save.error) : null}
    >
      <FormGroup>
        <Label for="dev-role-label">{t('users.profile.devRoleLabel')}</Label>
        <Input id="dev-role-label" type="select" value={value} onChange={(e) => setValue(e.target.value)} disabled={stored.isLoading}>
          {Object.entries(config?.roles ?? {}).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </Input>
        <FormText>{t('users.profile.devRoleHelp')}</FormText>
      </FormGroup>
    </FormDialog>
  );
};
