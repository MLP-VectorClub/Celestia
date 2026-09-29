import { FC, PropsWithChildren } from 'react';

import ExternalLink from 'src/components/shared/ExternalLink';

export interface FavMeProps extends PropsWithChildren {
  id: string;
}

const FavMe: FC<FavMeProps> = ({ id, children = null, ...rest }) => {
  const url = `https://fav.me/${id}`;
  return (
    <ExternalLink href={url} {...rest}>
      {children || url}
    </ExternalLink>
  );
};

export default FavMe;
