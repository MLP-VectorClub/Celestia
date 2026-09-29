import Link from 'next/link';
import { FC } from 'react';
import { Alert } from 'reactstrap';

import Content from 'src/components/shared/Content';
import StandardHeading from 'src/components/shared/StandardHeading';
import { PATHS } from 'src/paths';

interface PropTypes {
  heading: string;
  noun?: string;
}

export const GuideNotFound: FC<PropTypes> = ({ heading, noun = 'color guide' }) => (
  <Content>
    <StandardHeading heading={heading} lead={`The requested ${noun} could not be found`} />
    <Alert color="info" fade={false} className="text-center">
      Check out the <Link href={PATHS.GUIDE_INDEX}>list of available guides</Link> to hopefully find what you were looking for.
    </Alert>
  </Content>
);

export default GuideNotFound;
