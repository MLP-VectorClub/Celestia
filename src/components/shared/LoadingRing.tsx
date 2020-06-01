import React, { memo } from 'react';
import classNames from 'classnames';
import { Nullable } from '../../types';

export interface LoadingRingProps {
  color?: Nullable<string>;
  className?: string;
  strokeWidth?: number;
  outline?: boolean;
}

const LoadingRing: React.FC<LoadingRingProps> = ({
  color = null,
  className,
  strokeWidth = 6,
  outline = true,
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100"
    preserveAspectRatio="xMidYMid"
    className={classNames({ [`text-${color}`]: color }, className)}
  >
    {outline && (
      <circle
        cx="50"
        cy="50"
        r="40"
        stroke="#fff"
        fill="none"
        strokeWidth={String(strokeWidth * 1.66)}
        strokeLinecap="round"
      />
    )}
    <circle
      cx="50"
      cy="50"
      r="40"
      stroke="currentColor"
      fill="none"
      strokeWidth={String(strokeWidth)}
      strokeLinecap="round"
    >
      <animate
        attributeName="stroke-dashoffset"
        dur="2s"
        repeatCount="indefinite"
        from="0"
        to="502"
      />
      <animate
        attributeName="stroke-dasharray"
        dur="2s"
        repeatCount="indefinite"
        values="150.6 100.4;1 250;150.6 100.4"
      />
    </circle>
  </svg>
);

export default memo(LoadingRing);
