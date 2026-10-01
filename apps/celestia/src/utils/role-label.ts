import { Nullable, TFunction } from 'src/types';
import { DatabaseRole } from 'src/types/api-alias';

export const mapRoleLabel = (t: TFunction, role: Nullable<DatabaseRole>): string =>
  t(role === null ? 'common.roleLabel.guest' : `common.roleLabel.${role}`);
