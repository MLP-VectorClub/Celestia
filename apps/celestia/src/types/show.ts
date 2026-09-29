import { FC } from 'react';

import { ShowListItem } from '@mlp-vectorclub/api-types';

export interface ShowTableColumnDefinition {
  header: string;
  shortHeader?: string;
  only?: 'mobile' | 'desktop';
  renderContent: FC<{ entry: ShowListItem }>;
  tdClassName?: string;
}
