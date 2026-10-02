import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { FC, useState } from 'react';
import { Alert, Button, FormGroup, FormText, Input, Label } from 'reactstrap';

import { UserProfile } from '@mlp-vectorclub/api-types';
import { describeApiError, fieldErrors, useApiMutation, useAuth } from 'src/hooks';
import { UserAdminService } from 'src/services/user-admin';
import { ENDPOINTS } from 'src/utils';
import { permission } from 'src/utils/permission';

const pointsKey = (id: number) => `/users/${id}/personal-guide/points`;

const RoleForm: FC<{ profile: UserProfile }> = ({ profile }) => {
  const { replace, asPath } = useRouter();
  const roles = profile.editableRoles ?? {};
  const [role, setRole] = useState<string>(profile.user.role ?? '');
  const save = useApiMutation(() => UserAdminService.setRole(profile.user.id, role as never), {
    invalidate: [[ENDPOINTS.USER_PROFILE({ id: profile.user.id })]],
    onSuccess: () => void replace(asPath),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <FormGroup>
        <Label for="staff-role">Role</Label>
        <div className="d-flex gap-2">
          <Input id="staff-role" type="select" value={role} onChange={(e) => setRole(e.target.value)}>
            {Object.entries(roles).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </Input>
          <Button color="primary" disabled={save.isPending || role === profile.user.role}>
            Change role
          </Button>
        </div>
        {save.data?.alreadyIn && <FormText>The user already has this role.</FormText>}
        {save.error && <div className="text-danger small mt-1">{describeApiError(save.error)}</div>}
      </FormGroup>
    </form>
  );
};

const PointsForm: FC<{ userId: number }> = ({ userId }) => {
  const available = useQuery({ queryKey: [pointsKey(userId)], queryFn: () => UserAdminService.getPoints(userId).then((r) => r.data) });
  const [amount, setAmount] = useState('');
  const [comment, setComment] = useState('');
  const grant = useApiMutation(
    () => UserAdminService.grantPoints(userId, { amount: Number(amount), ...(comment.trim() ? { comment: comment.trim() } : {}) }),
    {
      invalidate: [[pointsKey(userId)]],
      onSuccess: () => {
        setAmount('');
        setComment('');
      },
    }
  );
  const errors = fieldErrors(grant.error);
  const value = Number(amount);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (Number.isInteger(value) && value !== 0) grant.mutate();
      }}
    >
      <FormGroup>
        <Label for="staff-points">Personal guide slot points</Label>
        <FormText tag="div" className="mb-1">
          {available.data
            ? `${available.data.amount} point${Math.abs(available.data.amount) === 1 ? '' : 's'} can still be granted or taken.`
            : 'Loading…'}
        </FormText>
        <div className="d-flex gap-2">
          <Input
            id="staff-points"
            type="number"
            placeholder="Amount (negative takes points)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            invalid={Boolean(errors.amount)}
          />
          <Input
            aria-label="Comment"
            placeholder="Comment (optional)"
            maxLength={140}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            invalid={Boolean(errors.comment)}
          />
          <Button color="primary" disabled={grant.isPending || !Number.isInteger(value) || value === 0}>
            Apply
          </Button>
        </div>
        {grant.error && <div className="text-danger small mt-1">{describeApiError(grant.error)}</div>}
        {grant.isSuccess && <FormText>Points updated.</FormText>}
      </FormGroup>
    </form>
  );
};

/** Role, personal guide points and (for developers) point history recalculation, shown to staff on a profile */
export const ProfileStaffControls: FC<{ profile: UserProfile }> = ({ profile }) => {
  const { user: authUser, isStaff } = useAuth();
  const isDeveloper = permission(authUser, 'developer');
  const recalc = useApiMutation(() => UserAdminService.recalculateHistory(profile.user.id));
  const showRole = profile.canEdit && profile.editableRoles && Object.keys(profile.editableRoles).length > 0;
  if (!isStaff || (!showRole && profile.sameUser)) return null;

  return (
    <section>
      <h2>Staff tools</h2>
      {showRole && <RoleForm profile={profile} />}
      <PointsForm userId={profile.user.id} />
      {isDeveloper && (
        <div className="mb-3">
          <Button color="ui" size="sm" disabled={recalc.isPending} onClick={() => recalc.mutate()}>
            Recalculate point history
          </Button>
          {recalc.isSuccess && <small className="ms-2 text-muted">Done.</small>}
          {recalc.error && (
            <Alert color="danger" fade={false} className="mt-2 mb-0" role="alert">
              {describeApiError(recalc.error)}
            </Alert>
          )}
        </div>
      )}
    </section>
  );
};
