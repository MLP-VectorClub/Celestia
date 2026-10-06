import classNames from 'classnames';
import { FC } from 'react';

import { GetTagsAutocompleteResult } from '@mlp-vectorclub/api-types';
import styles from 'modules/TagSuggestions.module.scss';
import InlineIcon from 'src/components/shared/InlineIcon';

type Suggestion = GetTagsAutocompleteResult['tags'][number];

interface PropTypes {
  suggestions: Suggestion[];
  /** Index of the highlighted one (arrow keys), `null` when none is */
  active: number | null;
  onPick: (tag: Suggestion) => void;
  id?: string;
}

/** The tags found while typing: name, how often it is used (or the tag a synonym points to), one click to take it */
export const TagSuggestions: FC<PropTypes> = ({ suggestions, active, onPick, id }) => {
  if (suggestions.length === 0) return null;
  return (
    <ul className={styles.list} role="listbox" id={id}>
      {suggestions.map((tag, index) => (
        <li key={tag.id} role="option" aria-selected={active === index}>
          <button
            type="button"
            className={classNames(styles.item, `typ-${tag.type ?? ''}`, {
              [styles.active]: active === index,
              [styles.synonym]: tag.synonymOf !== null,
            })}
            // The text field keeps the focus, so a click does not close the list before it is taken
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onPick(tag)}
          >
            <span className={styles.name}>{tag.name}</span>{' '}
            <span className={styles.uses}>
              {tag.synonymOf !== null ? (
                <>
                  <InlineIcon icon="sitemap" first />
                  {tag.synonymTarget}
                </>
              ) : (
                tag.uses
              )}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
};
