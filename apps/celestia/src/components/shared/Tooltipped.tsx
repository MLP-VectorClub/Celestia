import { FC, ReactNode, RefObject, useRef } from 'react';
import { UncontrolledTooltip, UncontrolledTooltipProps } from 'reactstrap';

interface PropTypes {
  /** The tooltip text, also what the element should use as its accessible name */
  title: string;
  placement?: UncontrolledTooltipProps['placement'];
  /** Renders the element the tooltip belongs to, the given ref goes to it (`innerRef` of a reactstrap component, `ref` of a plain element) */
  children: (ref: RefObject<any>) => ReactNode; // eslint-disable-line @typescript-eslint/no-explicit-any
}

/** A Bootstrap tooltip for an element that has only an icon, instead of the browser's `title` bubble */
export const Tooltipped: FC<PropTypes> = ({ title, placement = 'top', children }) => {
  const ref = useRef<HTMLElement>(null);

  return (
    <>
      {children(ref)}
      <UncontrolledTooltip target={ref as RefObject<HTMLElement>} placement={placement} fade={false}>
        {title}
      </UncontrolledTooltip>
    </>
  );
};
