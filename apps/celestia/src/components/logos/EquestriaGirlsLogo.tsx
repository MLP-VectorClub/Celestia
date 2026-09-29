import Image, { ImageProps } from 'next/image';
import { FC } from 'react';

import { ResponsiveContainer } from 'src/components/shared/ResponsiveContainer';
import { getGuideLabel } from 'src/utils';

export const EquestriaGirlsLogo: FC<Pick<ImageProps, 'priority'>> = ({ priority }) => (
  <ResponsiveContainer size={9000}>
    <Image src="/img/logos/eqg.svg" fill alt={`${getGuideLabel('eqg')} Logo`} priority={priority} />
  </ResponsiveContainer>
);
