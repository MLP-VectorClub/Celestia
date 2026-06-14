import { Nullable, TFunction } from 'src/types';
import { DatabaseRole } from '@mlp-vectorclub/api-types';

export const mapRoleLabel = (t: TFunction, role: Nullable<DatabaseRole>): string =>
  t(role === null ? 'common.roleLabel.guest' : `common.roleLabel.${role}`);
