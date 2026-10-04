import classNames from 'classnames';
import { useRouter } from 'next/router';
import { FC, useMemo } from 'react';
import { Table } from 'reactstrap';

import { GetShowRequest, GetShowResult } from '@mlp-vectorclub/api-types';
import Pagination from 'src/components/shared/Pagination';
import { ShowListItemRow } from 'src/components/show/ShowEntriesTableRow';
import { useShowList } from 'src/hooks/show';
import { Nullable } from 'src/types';
import { ShowTableColumnDefinition } from 'src/types/show';
import { validatePageParam } from 'src/utils/validate-page-param';

export interface ShowEntriesTableProps {
  params: Omit<GetShowRequest, 'page'>;
  pageQueryParam?: string;
  initialData: Nullable<GetShowResult>;
  columns: ShowTableColumnDefinition[];
  /** Address of the table, which the old site's links and browser tests use (`episodes`, `movies`) */
  tableId?: string;
}

export const ShowEntriesTable: FC<ShowEntriesTableProps> = ({ params, pageQueryParam = 'page', initialData, columns, tableId }) => {
  const { query } = useRouter();
  const page = useMemo(() => validatePageParam(query[pageQueryParam]), [pageQueryParam, query]);
  const entries = useShowList({ ...params, page }, initialData || undefined);

  const pageData = entries.data?.pagination;
  const { isPlaceholderData } = entries;
  return (
    <>
      {pageData && <Pagination {...pageData} pageParam={pageQueryParam} tooltipPos="bottom" />}
      <Table id={tableId} responsive borderless aria-busy={isPlaceholderData} className={classNames({ 'opacity-50': isPlaceholderData })}>
        <thead>
          <tr>
            {columns.map((col, i) => {
              const hasShortHeader = Boolean(col.shortHeader);
              return (
                <th
                  key={i}
                  className={classNames({
                    'd-lg-none': col.only === 'mobile',
                    'd-none d-lg-table-cell': col.only === 'desktop',
                  })}
                >
                  <span
                    className={classNames({
                      'd-none d-lg-inline': hasShortHeader,
                    })}
                  >
                    {col.header}
                  </span>
                  {hasShortHeader && <span className="d-lg-none">{col.shortHeader}</span>}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {entries.data?.show.map((entry) => (
            <ShowListItemRow key={entry.id} show={entry} columns={columns} />
          ))}
        </tbody>
      </Table>
      {pageData && <Pagination {...pageData} pageParam={pageQueryParam} tooltipPos="top" listClassName="mb-0" />}
    </>
  );
};
