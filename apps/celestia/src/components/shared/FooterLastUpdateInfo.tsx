import { FC, useMemo } from 'react';
import TimeAgo from 'src/components/shared/TimeAgo';
import { ServerInfoHookValue, useBuildData } from 'src/hooks';
import { useTranslations } from 'next-intl';

type PropTypes = Pick<ServerInfoHookValue, 'serverInfo'>;

const FooterLastUpdateInfo: FC<PropTypes> = ({ serverInfo }) => {
  const t = useTranslations();
  const buildData = useBuildData();
  const latestDate = useMemo<Date | undefined>(() => {
    const dates: Date[] = [];
    if (buildData && typeof buildData !== 'string') dates.push(buildData.commitTime);
    if (serverInfo && serverInfo?.commitDate) dates.push(serverInfo.commitDate);

    if (dates.length < 2) return dates[0];
    return dates.sort((a, b) => b.getTime() - a.getTime()).shift();
  }, [buildData, serverInfo]);

  return (
    <span id="update-info">
      {`${t('common.footer.lastUpdate')} `}
      {latestDate ? <TimeAgo id="last-update-time" date={latestDate} /> : t('common.footer.unknown')}
    </span>
  );
};

export default FooterLastUpdateInfo;
