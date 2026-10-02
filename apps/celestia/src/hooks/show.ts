import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { GetShowRequest, GetShowResult } from '@mlp-vectorclub/api-types';
import { showListFetcher } from 'src/fetchers/show';
import { ENDPOINTS } from 'src/utils';

/**
 * `initialData` is what the server rendered for the page that was requested, so it only belongs to that page's query: handing it to the query of any
 * other page (which shallow page changes create, the props stay the same) would show the wrong rows as if they were fresh. While another page loads the
 * previous one stays visible, so the pagination does not disappear in between.
 */
export const useShowList = (params: GetShowRequest, initialData?: GetShowResult) => {
  const key = ENDPOINTS.SHOW(params);
  const fetcher = useMemo(() => showListFetcher(params), [params]);
  const isForThisPage = initialData?.pagination.currentPage === (params.page ?? 1);
  const {
    data,
    error: showError,
    isPlaceholderData,
  } = useQuery({
    queryKey: [key],
    queryFn: fetcher,
    initialData: isForThisPage ? initialData : undefined,
    placeholderData: keepPreviousData,
  });

  return {
    data,
    showError,
    /** The rows are those of the previous page, the new one is still loading */
    isPlaceholderData,
  };
};
