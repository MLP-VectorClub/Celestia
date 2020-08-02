import ExternalLink from './ExternalLink';

const DeviantLink: React.FC<{ username: string }> = ({ username, children, ...rest }) => (
  <ExternalLink href={`https://www.deviantart.com/${username}`} {...rest}>
    {children || username}
  </ExternalLink>
);

export default DeviantLink;
