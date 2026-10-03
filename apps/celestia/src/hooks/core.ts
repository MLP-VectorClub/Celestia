import { useQuery } from '@tanstack/react-query';
import Axios from 'axios';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect } from 'react';

import { GetNoticesCurrentResult } from '@mlp-vectorclub/api-types';
import { csrfFetcher, usefulLinksFetcher } from 'src/fetchers';
import { AppDispatch } from 'src/store';
import { CoreSliceMirroredState } from 'src/store/slices';
import { PageTitle, TFunction, Translatable } from 'src/types';
import { ENDPOINTS } from 'src/utils';
import { titleSetter } from 'src/utils/core';

export function useCsrf() {
  const { data } = useQuery({
    queryKey: [ENDPOINTS.CSRF_INIT],
    queryFn: csrfFetcher,
    staleTime: 3600e3,
    refetchOnWindowFocus: false,
  });

  return data;
}

/** The links depend on who is looking (signed out visitors get the ones for everybody), so the answer is kept per signed in state */
export function useSidebarUsefulLinks(signedIn: boolean) {
  const fetcher = useCallback(() => usefulLinksFetcher()(), []);
  const { data } = useQuery({
    queryKey: [ENDPOINTS.USEFUL_LINKS_SIDEBAR, { signedIn }],
    queryFn: fetcher,
  });

  return data;
}

export const isTranslatable = (value: Translatable | unknown): value is Translatable => {
  if (typeof value === 'string' || value === null) return false;

  return Array.isArray(value) && value.length > 0 && typeof value[0] === 'string';
};

export const translatableValue = (t: TFunction, value: PageTitle): string => (isTranslatable(value) ? t(value[0], value[1]) : value || '');

export const useTitleSetter = (dispatch: AppDispatch, { title, breadcrumbs }: CoreSliceMirroredState): void => {
  const t = useTranslations();
  useEffect(() => {
    titleSetter({ dispatch }, { title: translatableValue(t, title) });
  }, [title, dispatch, t]);

  useEffect(() => {
    titleSetter(
      { dispatch },
      {
        breadcrumbs: breadcrumbs.map((crumb) => ({
          ...crumb,
          label: translatableValue(t, crumb.label),
        })),
      }
    );
  }, [breadcrumbs, dispatch, t]);
};

/** Site-wide notices that are currently active, refreshed every few minutes. Rendered in the browser only (the markup needs a DOM) */
export function useCurrentNotices() {
  const { data } = useQuery({
    queryKey: ['/notices/current'],
    queryFn: () => Axios.get<GetNoticesCurrentResult>('/notices/current').then((r) => r.data),
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });
  return data;
}
