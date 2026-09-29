import { FC } from 'react';
import { useSelector } from 'react-redux';

import { RootState } from 'src/store';

const HappeningSoon: FC = () => {
  const { upcomingEvents } = useSelector((state: RootState) => state.core);
  return <>{upcomingEvents.map(() => null)}</>;
};

export default HappeningSoon;
