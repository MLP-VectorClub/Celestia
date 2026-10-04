import { useTranslations } from 'next-intl';
import { FC, useState } from 'react';

import styles from 'modules/MuffinSelector.module.scss';
import { MuffinRating } from 'src/components/shared/MuffinRating';

interface PropTypes {
  value: number | null;
  onChange: (value: number) => void;
  /** Name of the whole group for screen readers */
  label: string;
  /** Called with the muffin under the pointer or focus, `null` when it leaves, to preview the rating */
  onPreview?: (value: number | null) => void;
}

const SCORES = [1, 2, 3, 4, 5];

/**
 * The rating image as a radio group: each fifth of it is a label with a radio button for that many muffins, and the muffins fill up to the one under
 * the pointer. The labels are the only children of the `rate` element, as in the old site's rating form
 */
export const MuffinSelector: FC<PropTypes> = ({ value, onChange, label, onPreview }) => {
  const t = useTranslations();
  const [preview, setPreview] = useState<number | null>(null);
  const shown = preview ?? value;
  const updatePreview = (next: number | null) => {
    setPreview(next);
    onPreview?.(next);
  };

  return (
    <div className={styles.selector} onMouseLeave={() => updatePreview(null)}>
      <div aria-hidden="true">
        <MuffinRating score={shown} width={250} />
      </div>
      <div className={`rate ${styles.options}`} role="radiogroup" aria-label={label}>
        {SCORES.map((score) => (
          <label key={score} className={styles.option} onMouseEnter={() => updatePreview(score)}>
            <input
              type="radio"
              name="vote"
              value={score}
              className="visually-hidden"
              checked={value === score}
              aria-label={t('show.voting.muffins', { count: score })}
              onChange={() => onChange(score)}
              onFocus={() => updatePreview(score)}
              onBlur={() => updatePreview(null)}
            />
          </label>
        ))}
      </div>
    </div>
  );
};
