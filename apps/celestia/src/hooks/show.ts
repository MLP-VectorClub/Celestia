import { useQuery } from '@tanstack/react-query';
import { showListFetcher } from 'src/fetchers/show';
import { GetShowRequest, GetShowResult } from '@mlp-vectorclub/api-types';
import { ENDPOINTS } from 'src/utils';
import { useMemo } from 'react';

export const useShowList = (params: GetShowRequest, initialData?: GetShowResult) => {
  const key = ENDPOINTS.SHOW(params);
  const fetcher = useMemo(() => showListFetcher(params), [params]);
  const { data, error: showError } = useQuery({
    queryKey: [key],
    queryFn: fetcher,
    initialData,
    placeholderData: undefined,
  });

  return {
    data,
    showError,
  };
};
