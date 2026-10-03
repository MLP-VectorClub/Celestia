import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { FC, JSX, MouseEventHandler, useCallback } from 'react';

import ExternalLink from 'src/components/shared/ExternalLink';
import { APP_HOST } from 'src/config';
import { useAuth, useSidebarUsefulLinks } from 'src/hooks';
import { PATHS } from 'src/paths';
import { useAppDispatch } from 'src/store';
import { coreActions } from 'src/store/slices';

/** The path of a link that points at this site by its full address (links carried over from the old site do), `null` for other sites */
export const pathOnThisSite = (url: string): string | null =>
  url === APP_HOST ? '/' : url.startsWith(`${APP_HOST}/`) ? url.slice(APP_HOST.length) : null;

const SidebarUsefulLinks: FC = () => {
  const t = useTranslations();
  const dispatch = useAppDispatch();
  const { signedIn } = useAuth();
  const usefulLinks = useSidebarUsefulLinks(signedIn);
  const dispatchActionByAnchor = useCallback(
    (anchor: string): MouseEventHandler<HTMLAnchorElement> =>
      (e) => {
        e.preventDefault();

        switch (anchor) {
          case '#color-avg':
            dispatch(coreActions.toggleColorAvg(true));
            break;
          default:
            console.warn(`Unhandled useful link anchor: ${anchor}`);
        }
      },
    [dispatch]
  );

  if (!usefulLinks || usefulLinks.length === 0) return null;

  return (
    <div className="links">
      <h3>{t('common.sidebar.usefulLinks')}</h3>
      <ul>
        {usefulLinks.map((el) => {
          let link: JSX.Element;
          const ownPath = pathOnThisSite(el.url);
          const externalUrl = ownPath === null && /^https?:\/\//.test(el.url);
          if (externalUrl) {
            link = (
              <ExternalLink href={el.url} title={el.title ?? undefined}>
                {el.label}
              </ExternalLink>
            );
          } else {
            const actionDispatcher = el.url.startsWith('#');
            if (actionDispatcher) {
              link =
                el.url === '#sprite-tpl' ? (
                  <Link href={PATHS.GUIDE_SPRITE} title={el.title ?? undefined}>
                    {el.label}
                  </Link>
                ) : (
                  <a href={el.url} onClick={dispatchActionByAnchor(el.url)} title={el.title ?? undefined}>
                    {el.label}
                  </a>
                );
            } else {
              link = (
                <Link href={ownPath ?? el.url} title={el.title ?? undefined}>
                  {el.label}
                </Link>
              );
            }
          }

          return <li key={el.id}>{link}</li>;
        })}
      </ul>
    </div>
  );
};

export default SidebarUsefulLinks;
