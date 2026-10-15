import { useTranslations } from 'next-intl';
import { FC, useId } from 'react';
import { Badge, UncontrolledTooltip } from 'reactstrap';

import ExternalLink from 'src/components/shared/ExternalLink';
import { API_DOCS_URL } from 'src/config';

/** "Resources for developers: JSON Export / API (WIP)", shown under the title of the guide pages like on the old site */
export const DeveloperResources: FC = () => {
  const t = useTranslations();
  const wipMeaning = `wip-meaning-${useId().replace(/:/g, '')}`;
  return (
    <p className="text-center">
      {t.rich('colorGuide.index.devResources', {
        export: (chunks) => <ExternalLink href="/dist/mlpvc-colorguide.json">{chunks}</ExternalLink>,
        api: (chunks) => <ExternalLink href={API_DOCS_URL}>{chunks}</ExternalLink>,
      })}{' '}
      <Badge tag="abbr" color="danger" id={wipMeaning}>
        {t('colorGuide.index.wip')}
      </Badge>
      <UncontrolledTooltip target={wipMeaning} fade={false}>
        {t('colorGuide.index.wipMeaning')}
      </UncontrolledTooltip>
    </p>
  );
};
