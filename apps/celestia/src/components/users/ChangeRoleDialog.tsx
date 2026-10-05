import { useTranslations } from 'next-intl';
import { useRouter } from 'next/router';
import { FC, useState } from 'react';
import { FormGroup, FormText, Input, Label } from 'reactstrap';

import { UserProfile } from '@mlp-vectorclub/api-types';
import { FormDialog } from 'src/components/shared/dialogs/FormDialog';
import { describeApiError, useApiMutation } from 'src/hooks';
import { UserAdminService } from 'src/services/user-admin';
import { ENDPOINTS } from 'src/utils';

/** Staff pick a new role for the user (the old site's blue spanner button next to the role) */
export const ChangeRoleDialog: FC<{ profile: UserProfile; isOpen: boolean; onClose: () => void }> = ({ profile, isOpen, onClose }) => {
  const t = useTranslations();
  const { replace, asPath } = useRouter();
  const roles = profile.editableRoles ?? {};
  const [role, setRole] = useState<string>(profile.user.role ?? '');
  const save = useApiMutation(() => UserAdminService.setRole(profile.user.id, role as never), {
    invalidate: [[ENDPOINTS.USER_PROFILE({ id: profile.user.id })]],
    onSuccess: () => {
      onClose();
      void replace(asPath);
    },
  });

  return (
    <FormDialog
      title={t('users.profile.changeRoleTitle', { name: profile.user.name })}
      isOpen={isOpen}
      onClose={() => {
        save.reset();
        onClose();
      }}
      onSubmit={() => save.mutate()}
      submitLabel={t('users.staffTools.changeRole')}
      busy={save.isPending}
      error={save.error ? describeApiError(save.error) : null}
    >
      <FormGroup>
        <Label for="staff-role">{t('users.staffTools.role')}</Label>
        <Input id="staff-role" type="select" value={role} onChange={(e) => setRole(e.target.value)}>
          {Object.entries(roles).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </Input>
        {save.data?.alreadyIn && <FormText>{t('users.staffTools.alreadyRole')}</FormText>}
      </FormGroup>
    </FormDialog>
  );
};
