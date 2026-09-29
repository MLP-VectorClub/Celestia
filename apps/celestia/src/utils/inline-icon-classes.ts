import { Argument, Mapping } from 'classnames';

export const getInlineIconClasses = (color?: string, first?: boolean, last?: boolean): Argument => {
  const classes: Mapping = {
    'ms-2': last,
    'me-2': first,
  };

  if (color) classes[`text-${color}`] = color;

  return classes;
};
