import { useTranslations } from 'next-intl';
import { FC } from 'react';

import { GuideName, SlimGuideTag } from '@mlp-vectorclub/api-types';
import AppearanceItemTags from 'src/components/colorguide/AppearanceItemTags';
import InlineIcon from 'src/components/shared/InlineIcon';
import { Nullable } from 'src/types';

interface PropTypes {
  tags?: SlimGuideTag[];
  guide?: Nullable<GuideName>;
}

const AppearanceTags: FC<PropTypes> = (props) => {
  const t = useTranslations();
  const { tags, guide } = props;
  if (!tags || tags.length === 0) return null;

  return (
    <>
      <h2>
        <InlineIcon icon="tags" first size="xs" />
        {t('colorGuide.appearance.tags')}
      </h2>
      <AppearanceItemTags tags={tags} guide={guide} />
    </>
  );
};

export default AppearanceTags;
