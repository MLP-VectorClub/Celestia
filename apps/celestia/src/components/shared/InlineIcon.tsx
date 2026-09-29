import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import { ForwardRefRenderFunction, forwardRef, memo } from 'react';

import LoadingRing from 'src/components/shared/LoadingRing';
import { InlineIconProps } from 'src/types/component-props';
import { getInlineIconClasses } from 'src/utils';

const InlineIcon: ForwardRefRenderFunction<SVGSVGElement, InlineIconProps> = (
  { icon, loading = false, last = false, first = false, color, className, ...faProps },
  ref
) => {
  if (loading) {
    return <LoadingRing inline spaceLeft={last} spaceRight={first} color={color} className={className} />;
  }

  if (!icon) return null;

  return <FontAwesomeIcon icon={icon} className={classNames(className, getInlineIconClasses(color, first, last))} ref={ref} {...faProps} />;
};

export default memo(forwardRef(InlineIcon));
