import { IconProp } from '@fortawesome/fontawesome-svg-core';
import classNames from 'classnames';
import Link from 'next/link';
import { FC, ReactNode, memo } from 'react';

import { GuideName, SlimGuideTag } from '@mlp-vectorclub/api-types';
import styles from 'modules/Tag.module.scss';
import InlineIcon from 'src/components/shared/InlineIcon';
import { PATHS } from 'src/paths';
import { Nullable } from 'src/types';
import { TagType } from 'src/types/api-alias';

const TAG_ICON_MAP: Record<TagType, IconProp> = {
  app: 'folder',
  cat: 'users',
  gen: 'tag',
  spec: 'globe-americas',
  char: 'user',
  warn: 'exclamation-triangle',
};
const TAG_CLASS_MAP: Record<TagType, string> = {
  app: styles.typeClothing,
  cat: styles.typeCategory,
  gen: styles.typeGender,
  spec: styles.typeSpecies,
  char: styles.typeCharacter,
  warn: styles.typeWarning,
};

interface PropTypes {
  tag: SlimGuideTag;
  className?: string;
  guide?: Nullable<GuideName>;
  /** Controls inside the tag, after its name (staff menus) */
  extra?: ReactNode;
}

const TagComponent: FC<PropTypes> = ({ tag, className, guide = null, extra }) => {
  const tagTypeClass = tag.type && tag.type in TAG_CLASS_MAP && TAG_CLASS_MAP[tag.type];
  const finalClassName = classNames(
    styles.tag,
    tagTypeClass,
    { [styles.synonym]: 'synonymOf' in tag && tag.synonymOf, [styles.withExtra]: Boolean(extra) },
    className
  );
  const content = (
    <>
      {tag.type && <InlineIcon icon={TAG_ICON_MAP[tag.type]} first />}
      {tag.name}
    </>
  );

  // The controls live inside the tag's own box, so the link (a button cannot be inside of one) is only the name
  if (extra) {
    return (
      <span className={finalClassName}>
        {guide ? (
          <Link href={PATHS.GUIDE(guide, { q: tag.name })} className={styles.tagLink}>
            {content}
          </Link>
        ) : (
          <span>{content}</span>
        )}
        {extra}
      </span>
    );
  }

  if (guide) {
    return (
      <Link href={PATHS.GUIDE(guide, { q: tag.name })} className={finalClassName}>
        {content}
      </Link>
    );
  }

  return <span className={finalClassName}>{content}</span>;
};

export const Tag = memo(TagComponent);
