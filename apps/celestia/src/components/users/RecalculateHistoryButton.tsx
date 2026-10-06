import { useTranslations } from 'next-intl';
import { FC } from 'react';
import { Alert, Button } from 'reactstrap';

import InlineIcon from 'src/components/shared/InlineIcon';
import { useDialog } from 'src/components/shared/dialogs/DialogProvider';
import { describeApiError, useApiMutation } from 'src/hooks';
import { UserAdminService } from 'src/services/user-admin';

/** Developers only: rebuilds the user's point history from their posts, like the old point history page's "Recalculate" button */
export const RecalculateHistoryButton: FC<{ userId: number }> = ({ userId }) => {
  const t = useTranslations();
  const { confirm } = useDialog();
  const recalc = useApiMutation(() => UserAdminService.recalculateHistory(userId), {
    // Every page of the history and the profile's progress are out of date now
    invalidate: [[`/users/${userId}/personal-guide/point-history`], [`/users/${userId}`]],
  });

  return (
    <>
      <Button
        color="orange"
        size="sm"
        disabled={recalc.isPending}
        onClick={async () => {
          if (await confirm({ title: t('users.pointHistory.recalculate'), body: t('users.staffTools.recalculate'), confirmLabel: t('users.pointHistory.recalculate') })) {
            recalc.mutate();
          }
        }}
      >
        <InlineIcon icon="calculator" first />
        {t('users.pointHistory.recalculate')}
      </Button>
      {recalc.error && (
        <Alert color="danger" fade={false} role="alert" className="w-100 mt-2">
          {describeApiError(recalc.error)}
        </Alert>
      )}
    </>
  );
};
