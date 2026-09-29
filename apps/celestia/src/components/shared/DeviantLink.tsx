import { FC, PropsWithChildren } from 'react';

import ExternalLink from 'src/components/shared/ExternalLink';

const DeviantLink: FC<PropsWithChildren<{ username: string }>> = ({ username, children, ...rest }) => (
  <ExternalLink href={`https://www.deviantart.com/${username}`} {...rest}>
    {children || username}
  </ExternalLink>
);

export default DeviantLink;
