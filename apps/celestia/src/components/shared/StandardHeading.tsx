import { FC, ReactNode } from 'react';

export interface StandardHeadingProps {
  heading: ReactNode;
  lead?: ReactNode;
}

const StandardHeading: FC<StandardHeadingProps> = ({ heading, lead }) => (
  <>
    <h1 className="page-heading">{heading}</h1>
    {lead !== undefined && lead !== null && lead !== false && (
      <div className="lead page-lead" role="heading" aria-level={1}>
        {lead}
      </div>
    )}
  </>
);
export default StandardHeading;
