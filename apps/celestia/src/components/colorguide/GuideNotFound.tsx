import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { FC, ReactNode } from 'react';
import { Alert } from 'reactstrap';

import Content from 'src/components/shared/Content';
import StandardHeading from 'src/components/shared/StandardHeading';
import { PATHS } from 'src/paths';

interface PropTypes {
  heading: string;
  /** What could not be found, already translated; the color guide when left out */
  noun?: string;
}

export const GuideNotFound: FC<PropTypes> = ({ heading, noun }) => {
  const t = useTranslations();
  return (
    <Content>
      <StandardHeading heading={heading} lead={t('colorGuide.notFound.lead', { noun: noun ?? t('colorGuide.notFound.nouns.guide') })} />
      <Alert color="info" fade={false} className="text-center">
        {t.rich('colorGuide.notFound.help', { link: (chunks: ReactNode) => <Link href={PATHS.GUIDE_INDEX}>{chunks}</Link> })}
      </Alert>
    </Content>
  );
};
