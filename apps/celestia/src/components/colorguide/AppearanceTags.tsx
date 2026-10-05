import { useTranslations } from 'next-intl';
import { FC, ReactNode } from 'react';

import { GuideName, SlimGuideTag } from '@mlp-vectorclub/api-types';
import AppearanceItemTags from 'src/components/colorguide/AppearanceItemTags';
import InlineIcon from 'src/components/shared/InlineIcon';
import { Nullable } from 'src/types';

interface PropTypes {
  tags?: SlimGuideTag[];
  guide?: Nullable<GuideName>;
  renderExtra?: (tag: SlimGuideTag) => ReactNode;
}

const AppearanceTags: FC<PropTypes> = (props) => {
  const t = useTranslations();
  const { tags, guide, renderExtra } = props;
  if (!tags || tags.length === 0) return null;

  return (
    <>
      <h2>
        <InlineIcon icon="tags" first size="xs" />
        {t('colorGuide.appearance.tags')}
      </h2>
      <AppearanceItemTags tags={tags} guide={guide} renderExtra={renderExtra} />
    </>
  );
};

export default AppearanceTags;
