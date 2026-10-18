import { useTranslations } from 'next-intl';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FC } from 'react';
import { Breadcrumb, BreadcrumbItem } from 'reactstrap';

import { translatableValue } from 'src/hooks';
import { useAppSelector } from 'src/store';
import { renderingStateSlice } from 'src/utils/store';
import { breadcrumbListJsonLd, serializeJsonLd } from 'src/utils/structured-data';

const ELEMENT_ID = 'breadcrumbs';

const Breadcrumbs: FC = () => {
  const t = useTranslations();
  const { asPath } = useRouter();
  const { breadcrumbs } = useAppSelector((state) => renderingStateSlice(state.core));

  if (breadcrumbs.length === 0) return <div id={ELEMENT_ID} />;

  const jsonLd = breadcrumbListJsonLd(
    breadcrumbs.map((el) => ({ name: translatableValue(t, el.label), href: el.linkProps?.href })),
    asPath.split('#')[0]
  );

  return (
    <Breadcrumb id={ELEMENT_ID}>
      <Head>
        <script key="breadcrumbs-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      </Head>
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
