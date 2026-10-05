import { FC, Fragment, ReactNode, useMemo } from 'react';

import { GuideName, SlimGuideTag } from '@mlp-vectorclub/api-types';
import styles from 'modules/AppearanceTags.module.scss';
import { Tag } from 'src/components/colorguide/Tag';
import { Nullable } from 'src/types';
import { sortTagsByType } from 'src/utils';

interface PropTypes {
  tags: SlimGuideTag[];
  guide?: Nullable<GuideName>;
  /** Something after each tag, e.g. staff controls */
  renderExtra?: (tag: SlimGuideTag) => ReactNode;
}

const AppearanceItemTags: FC<PropTypes> = ({ tags, guide, renderExtra }) => {
  const sortedTags = useMemo<PropTypes['tags']>(() => {
    // No point in sorting empty and single-item arrays
    if (tags.length < 2) return tags;

    return tags.sort(sortTagsByType);
  }, [tags]);

  if (sortedTags.length === 0) return null;

  return (
    <div className={styles.tags}>
      {sortedTags.map((tag) => (
        <Fragment key={tag.id}>
          <Tag tag={tag} guide={guide} />
          {renderExtra?.(tag)}
        </Fragment>
      ))}
    </div>
  );
};

export default AppearanceItemTags;
