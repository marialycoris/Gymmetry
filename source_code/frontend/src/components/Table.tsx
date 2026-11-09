import { Children, useState, type ReactNode } from 'react';
import { Pagination } from './Pagination';

export const td = 'px-6 py-3 align-middle';

interface TableProps {
  headers: string[];
  children: ReactNode;
  isEmpty?: boolean;
  emptyText?: string;
  pageSize?: number;
  resetKey?: unknown;
  itemLabel?: string;
}

// Meant to sit inside <Card>; negative margins let the table run edge to edge.
export function Table({
  headers,
  children,
  isEmpty,
  emptyText = 'Nothing here yet.',
  pageSize,
  resetKey,
  itemLabel = 'items',
}: TableProps) {
  const items = Children.toArray(children);
  const [pagination, setPagination] = useState<{ key: unknown; page: number }>({ key: resetKey, page: 1 });
  const page = Object.is(pagination.key, resetKey) ? pagination.page : 1;
  const setPage = (next: number) => setPagination({ key: resetKey, page: next });

  if (isEmpty || items.length === 0) return <p className="text-gray-500 text-center py-6">{emptyText}</p>;

  const total = items.length;
  const totalPages = pageSize ? Math.max(1, Math.ceil(total / pageSize)) : 1;
  const current = Math.min(page, totalPages);
  const visible = pageSize ? items.slice((current - 1) * pageSize, current * pageSize) : items;
  const from = pageSize ? (current - 1) * pageSize + 1 : 1;
  const to = pageSize ? Math.min(current * pageSize, total) : total;

  return (
    <>
      <div className="overflow-x-auto -mx-6 -my-2">
        <table className="w-full text-sm text-center">
          <thead>
            <tr className="text-gray-500 border-b border-gray-200">
              {headers.map((h) => <th key={h} scope="col" className="px-6 py-3 font-semibold whitespace-nowrap">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">{visible}</tbody>
        </table>
      </div>
      {pageSize && (
        <div className="-mx-6 -mb-2 mt-2">
          <Pagination
            page={current}
            totalPages={totalPages}
            total={total}
            from={from}
            to={to}
            onPageChange={setPage}
            itemLabel={itemLabel}
          />
        </div>
      )}
    </>
  );
}
