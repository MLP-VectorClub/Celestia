import { FC } from 'react';

import { GetAppearancesPinnedResult, GuideName } from '@mlp-vectorclub/api-types';
import AppearanceItem from 'src/components/colorguide/AppearanceItem';
import { usePinnedAppearances } from 'src/hooks';
import { Nullable } from 'src/types';

interface PropTypes {
  guide: Nullable<GuideName>;
  initialData: Nullable<GetAppearancesPinnedResult>;
}

const PinnedAppearance: FC<PropTypes> = ({ initialData, guide }) => {
  const appearances = usePinnedAppearances({ guide }, initialData || undefined);

  if (!appearances) return null;

  return (
    <>
      {appearances.map((el) => (
        <AppearanceItem key={el.id} appearance={el} pinned guide={guide} />
      ))}
    </>
  );
};

export default PinnedAppearance;
