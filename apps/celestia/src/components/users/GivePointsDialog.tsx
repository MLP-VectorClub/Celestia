import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { FC, useState } from 'react';
import { FormGroup, FormText, Input, Label } from 'reactstrap';

import { UserProfile } from '@mlp-vectorclub/api-types';
import { FormDialog } from 'src/components/shared/dialogs/FormDialog';
import { useDialog } from 'src/components/shared/dialogs/DialogProvider';
import { describeApiError, fieldErrors, useApiMutation } from 'src/hooks';
import { UserAdminService } from 'src/services/user-admin';
import { ENDPOINTS } from 'src/utils';

const pointsKey = (id: number) => `/users/${id}/personal-guide/points`;

/** "Give points" of the personal guide section: staff give or take points, after a confirmation that says what is about to happen */
export const GivePointsDialog: FC<{ profile: UserProfile; isOpen: boolean; onClose: () => void }> = ({ profile, isOpen, onClose }) => {
  const t = useTranslations();
  const { confirm } = useDialog();
  const userId = profile.user.id;
  const available = useQuery({
    queryKey: [pointsKey(userId)],
    queryFn: () => UserAdminService.getPoints(userId).then((r) => r.data),
    enabled: isOpen,
    staleTime: 0,
  });
  const [amount, setAmount] = useState('');
  const [comment, setComment] = useState('');
  const grant = useApiMutation(
    () => UserAdminService.grantPoints(userId, { amount: Number(amount), ...(comment.trim() ? { comment: comment.trim() } : {}) }),
    {
      invalidate: [[pointsKey(userId)], [ENDPOINTS.USER_PROFILE({ id: userId })]],
      onSuccess: () => {
        setAmount('');
        setComment('');
        onClose();
      },
    }
  );
  const errors = fieldErrors(grant.error);
  const value = Number(amount);
  const name = profile.user.name;

  const submit = async () => {
    if (!Number.isInteger(value) || value === 0) return;
    const count = Math.abs(value);
    if (
      await confirm({
        title: t(value > 0 ? 'users.givePoints.confirmGive' : 'users.givePoints.confirmTake', { count, name }),
        body: t(value > 0 ? 'users.givePoints.bodyGive' : 'users.givePoints.bodyTake', { count, name }),
        confirmLabel: t(value > 0 ? 'users.givePoints.confirmGive' : 'users.givePoints.confirmTake', { count, name }),
      })
    ) {
      grant.mutate();
    }
  };

  return (
    <FormDialog
      title={t('users.givePoints.title', { name })}
      isOpen={isOpen}
      onClose={() => {
        grant.reset();
        onClose();
      }}
      onSubmit={() => void submit()}
      submitLabel={t('users.givePoints.continue')}
      busy={grant.isPending}
      error={grant.error ? describeApiError(grant.error) : null}
    >
      <p>{t.rich('users.givePoints.intro', { strong: (chunks) => <strong>{chunks}</strong> })}</p>
      <p>{t.rich('users.givePoints.remember', { strong: (chunks) => <strong>{chunks}</strong> })}</p>
      <FormGroup>
        <Label for="give-points-amount">{t('users.givePoints.amount')}</Label>
        <Input
          id="give-points-amount"
          type="number"
          step={1}
          min={available.data ? -available.data.amount : undefined}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          invalid={Boolean(errors.amount)}
          required
        />
        {available.data && <FormText>{t('users.staffTools.available', { count: available.data.amount })}</FormText>}
      </FormGroup>
      <FormGroup>
        <Label for="give-points-comment">{t('users.givePoints.comment')}</Label>
        <Input
          id="give-points-comment"
          type="textarea"
          maxLength={140}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          invalid={Boolean(errors.comment)}
        />
      </FormGroup>
    </FormDialog>
  );
};
