import { useTranslations } from 'next-intl';
import { FC, useId } from 'react';

import { MUFFIN_SHAPES } from 'src/components/shared/muffin-shapes';

interface PropTypes {
  /** Average rating, `null` when nobody voted yet */
  score: number | null;
  /** Rating that fills all muffins */
  max?: number;
  /** Width in pixels */
  width?: number;
  className?: string;
}

/** Five muffins filled from the left in proportion to the rating, with the rest of them dimmed */
export const MuffinRating: FC<PropTypes> = ({ score, max = 5, width = 150, className }) => {
  const t = useTranslations();
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const percent = score === null ? 0 : Math.min(100, Math.max(0, (score / max) * 100));
  const label = score === null ? t('show.rating.none') : t('show.rating.rated', { score: Math.round(score * 100) / 100, max });
  const shapes = (
    <g id={`${id}-muffins`}>
      {MUFFIN_SHAPES.map((shape) => (
        <path key={shape.d} {...shape.attrs} d={shape.d} fillRule="evenodd" clipRule="evenodd" />
      ))}
    </g>
  );

  return (
    <svg
      viewBox="0 0 100 17"
      role="img"
      aria-label={label}
      className={className}
      width={width}
      data-percent={Math.round(percent * 100) / 100}
    >
      <defs>
        {shapes}
        <clipPath id={`${id}-fill`}>
          <rect x="0" y="0" width={percent} height="17" />
        </clipPath>
      </defs>
      <use href={`#${id}-muffins`} opacity="0.2" />
      <use href={`#${id}-muffins`} clipPath={`url(#${id}-fill)`} />
    </svg>
  );
};
