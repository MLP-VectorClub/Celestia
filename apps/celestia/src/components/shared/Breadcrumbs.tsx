import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { FC } from 'react';
import { Breadcrumb, BreadcrumbItem } from 'reactstrap';

import { translatableValue } from 'src/hooks';
import { useAppSelector } from 'src/store';
import { renderingStateSlice } from 'src/utils/store';

const ELEMENT_ID = 'breadcrumbs';

const Breadcrumbs: FC = () => {
  const t = useTranslations();
  const { breadcrumbs } = useAppSelector((state) => renderingStateSlice(state.core));

  // TODO Rich JSON+LD data for SEO

  if (breadcrumbs.length === 0) return <div id={ELEMENT_ID} />;

  return (
    <Breadcrumb id={ELEMENT_ID}>
      <BreadcrumbItem className="breadcrumb-item-divider" />
      {breadcrumbs.map((el, i) => {
        const isActive = el.active === true;
        const Tag = isActive ? 'strong' : el.linkProps ? 'a' : 'span';
        const item = (
          <Tag className="breadcrumb-item" key={el.linkProps ? undefined : i}>
            {translatableValue(t, el.label)}
          </Tag>
        );

        if (!el.linkProps) {
          return item;
        }

        return (
          <Link key={i} {...el.linkProps} passHref legacyBehavior>
            {item}
          </Link>
        );
      })}
    </Breadcrumb>
  );
};

export default Breadcrumbs;
