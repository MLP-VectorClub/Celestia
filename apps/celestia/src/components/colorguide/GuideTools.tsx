import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { FC } from 'react';

import { PATHS } from 'src/paths';

const TOOLS = [
  { key: 'sprite', href: PATHS.GUIDE_SPRITE },
  { key: 'blending', href: PATHS.BLENDING },
  { key: 'blendingReverse', href: PATHS.BLENDING_REVERSE },
  { key: 'picker', href: PATHS.PICKER },
] as const;

/** Links to the standalone color tools, shown below the list of guides */
export const GuideTools: FC = () => {
  const t = useTranslations();
  return (
    <section className="text-center mt-4" aria-labelledby="guide-tools-heading">
      <h2 id="guide-tools-heading" className="h4">
        {t('colorGuide.index.tools.heading')}
      </h2>
      <ul className="list-unstyled">
        {TOOLS.map(({ key, href }) => (
          <li key={key} className="mb-2">
            <Link href={href}>{t(`colorGuide.index.tools.${key}.name`)}</Link>
            <br />
            <small className="text-muted">{t(`colorGuide.index.tools.${key}.description`)}</small>
          </li>
        ))}
      </ul>
    </section>
  );
};
